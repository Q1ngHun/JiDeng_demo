"""长辈档案与访问记录（FR-15 / FR-03 / PRD §12.3）。"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from common import check_elder_access, family_members
from db import get_db
from deps import current_member, current_user
from models import AccessLog, Elder, FamilyMember, FollowUp, Medication, Report, User
from response import ok
from serializers import elder_brief, member_brief, med_dict, report_dict
from utils import beijing_now, human_dt, iso, parse_date, relative_day_label, today

router = APIRouter(prefix="/api/elders", tags=["elders"])

PROFILE_FIELDS = [
    ("birthday", "生日"), ("conditions", "既往史"), ("allergies", "过敏史"),
    ("hospital", "常去医院"), ("doctor", "医生"), ("height", "身高"),
    ("weight", "体重"), ("bloodType", "血型"),
]


def compute_completeness(e: Elder) -> int:
    total = len(PROFILE_FIELDS) + 2  # + 姓名 + 下次复查
    filled = 1 if e.name else 0
    filled += 1 if e.next_checkup_at else 0
    for key, _ in PROFILE_FIELDS:
        if getattr(e, key):
            filled += 1
    return int(round(filled / total * 100))


class ElderPatch(BaseModel):
    name: Optional[str] = None
    birthday: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    hospital: Optional[str] = None
    doctor: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    bloodType: Optional[str] = None
    nextCheckup: Optional[str] = None


class AccessBody(BaseModel):
    scope: str = "查看全部"
    action: str = "view"


@router.get("/{elder_id}")
def detail(
    elder_id: int,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    elder = check_elder_access(db, member, elder_id)
    meds = db.query(Medication).filter(Medication.elder_id == elder.id).all()
    active_meds = [m for m in meds if m.status == "active"]
    reports = db.query(Report).filter(Report.elder_id == elder.id).order_by(Report.taken_at.desc()).all()
    followups = db.query(FollowUp).filter(FollowUp.elder_id == elder.id, FollowUp.is_active == True).all()  # noqa: E712
    members = family_members(db, member.family_id)
    logs = (
        db.query(AccessLog)
        .filter(AccessLog.elder_id == elder.id)
        .order_by(AccessLog.id.desc())
        .limit(8)
        .all()
    )

    return ok({
        "elder": elder_brief(elder),
        "fields": [
            {"key": "birthday", "label": "生日", "value": elder.birthday, "muted": False},
            {"key": "conditions", "label": "既往史", "value": elder.conditions, "muted": False},
            {"key": "allergies", "label": "过敏史", "value": elder.allergies, "muted": False, "danger": bool(elder.allergies)},
            {"key": "hospital", "label": "常去医院 · 医生", "value": f"{elder.hospital} · {elder.doctor}" if elder.hospital else "", "muted": False},
            {"key": "height", "label": "身高 / 体重", "value": f"{elder.height} / {elder.weight}" if elder.height else "", "muted": False},
            {"key": "bloodType", "label": "血型", "value": elder.blood_type, "muted": False},
        ],
        "badges": {
            "nextCheckup": iso(elder.next_checkup_at),
            "nextCheckupLabel": f"下次复查 {elder.next_checkup_at.month}/{elder.next_checkup_at.day}" if elder.next_checkup_at else "未设置复查",
            "medCount": len(active_meds),
            "authorizedCount": len([m for m in members if m.role == "member"]),
        },
        "medications": [med_dict(m) for m in meds],
        "followUps": [{
            "id": f.id,
            "title": f.title,
            "cycleDays": f.cycle_days,
            "cycleLabel": f"每 {f.cycle_days} 天" if f.cycle_days % 30 else f"每 {f.cycle_days // 30} 个月",
            "lastDate": iso(f.last_date),
            "nextDate": iso(f.next_date),
            "needConfirm": f.need_confirm,
        } for f in followups],
        "reports": [report_dict(r) for r in reports[:3]],
        "accessLogs": [_log_dict(l) for l in logs],
        "permissions": [
            {**member_brief(m), "isElder": m.role == "elder"} for m in members
        ],
        "notice": "档案默认仅你与长辈本人可见。给协作子女开权限时，可以只开「用药」不开「既往史」。",
    })


@router.patch("/{elder_id}")
def update(
    elder_id: int,
    body: ElderPatch,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可编辑档案")
    elder = check_elder_access(db, member, elder_id)
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        if key == "nextCheckup":
            elder.next_checkup_at = parse_date(value) if value else None
        else:
            setattr(elder, key, value)
    elder.completeness = compute_completeness(elder)
    db.commit()
    db.refresh(elder)
    return ok(elder_brief(elder), "已保存")


@router.get("/{elder_id}/access-logs")
def access_logs(
    elder_id: int,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    elder = check_elder_access(db, member, elder_id)
    logs = (
        db.query(AccessLog)
        .filter(AccessLog.elder_id == elder.id)
        .order_by(AccessLog.id.desc())
        .limit(50)
        .all()
    )
    return ok([_log_dict(l) for l in logs])


@router.post("/{elder_id}/access-log")
def record_access(
    elder_id: int,
    body: AccessBody,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    """查看档案也要留痕：这是知情权的最小可执行单位。"""
    elder = check_elder_access(db, member, elder_id)
    log = AccessLog(
        elder_id=elder.id,
        viewer_id=user.id,
        viewer_name=user.real_name or user.nickname,
        viewer_tag="本人" if member.role == "elder" else "已授权",
        scope=body.scope,
        action=body.action,
    )
    db.add(log)
    db.commit()
    return ok(_log_dict(log), "已记录")


def _log_dict(l: AccessLog):
    return {
        "id": l.id,
        "viewerName": l.viewer_name,
        "viewerTag": l.viewer_tag,
        "avatarText": (l.viewer_name or "?")[:1],
        "scope": l.scope,
        "action": l.action,
        "timeLabel": relative_day_label(l.created_at),
        "createdAt": iso(l.created_at),
    }
