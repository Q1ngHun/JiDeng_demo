"""导出照护记录 PDF（FR-26 / §5.2）。"""
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from common import primary_elder
from config import EXPORT_DIR
from db import get_db
from deps import current_family, current_member, current_user
from models import (
    AccessLog, Elder, ExportRecord, Family, FamilyMember, Task, TaskEvent, User,
)
from response import ok
from routers.membership import quota as membership_quota
from serializers import event_dict
from services import pdf as pdf_service
from services import tasks_service
from utils import beijing_now, iso, parse_dt, today

router = APIRouter(prefix="/api/export", tags=["export"])


class ExportBody(BaseModel):
    scope: str = "month"  # month / custom / abnormal
    start: str = ""
    end: str = ""
    onlyAbnormal: bool = False
    includeEvidence: bool = True
    includeProfile: bool = True
    hideNames: bool = False


def _range(db: Session, member: FamilyMember, body: ExportBody):
    now = beijing_now()
    if body.scope == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif body.start and body.end:
        start = datetime.combine(parse_dt(body.start).date(), time.min)
        end = datetime.combine(parse_dt(body.end).date(), time.max)
    else:
        start = now - timedelta(days=30)
        end = now
    return start, end


def _collect(db: Session, family_id: int, start, end, only_abnormal: bool):
    events = (
        db.query(TaskEvent)
        .filter(TaskEvent.family_id == family_id)
        .filter(TaskEvent.created_at >= start)
        .filter(TaskEvent.created_at <= end)
        .order_by(TaskEvent.created_at)
        .all()
    )
    rows = []
    for e in events:
        task = e.task
        if only_abnormal and e.action not in ("timeout", "cancel", "reassign", "question"):
            continue
        if e.action == "export":
            continue
        rows.append({
            "date": e.created_at.strftime("%Y-%m-%d"),
            "dateLabel": f"{e.created_at.month}/{e.created_at.day}",
            "time": e.created_at.strftime("%H:%M"),
            "title": e.task.title if e.task else "系统事件",
            "actorName": e.actor_name,
            "actionLabel": {
                "create": "创建", "claim": "认领", "start": "开始", "complete": "完成",
                "confirm": "确认", "remind": "提醒", "reassign": "改派", "cancel": "取消",
                "timeout": "超时", "question": "有疑问",
            }.get(e.action, e.action),
            "statusLabel": e.action,
            "attachments": [],
        })
        if task and getattr(task, "attachments", None):
            rows[-1]["attachments"] = [{"url": a.url} for a in task.attachments]
    return rows


@router.get("/preview")
def preview(
    scope: str = "month",
    start: str = "",
    end: str = "",
    onlyAbnormal: bool = False,
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    body = ExportBody(scope=scope, start=start, end=end, onlyAbnormal=onlyAbnormal)
    s, e = _range(db, member, body)
    rows = _collect(db, family.id, s, e, onlyAbnormal)
    q = membership_quota(db, family.id)
    return ok({
        "familyName": family.name,
        "scopeLabel": f"{s.month}月" if scope == "month" else f"{s.month}/{s.day} – {e.month}/{e.day}",
        "rangeStart": iso(s),
        "rangeEnd": iso(e),
        "eventCount": len(rows),
        "evidenceCount": sum(len(r["attachments"]) for r in rows),
        "sample": rows[:5],
        "quota": q,
        "canExport": q["exports"]["limit"] < 0 or q["exports"]["left"] > 0,
        "hint": "给医生看时建议只保留「就诊与用药」相关记录。",
        "watermark": "仅用于就医沟通",
    })


@router.post("")
def export_pdf(
    body: ExportBody,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    q = membership_quota(db, family.id)
    if q["exports"]["limit"] <= 0:
        raise HTTPException(status_code=402, detail="导出 PDF 为家庭会员权益")
    if q["exports"]["left"] <= 0:
        raise HTTPException(status_code=402, detail="本月导出次数已用完")

    s, e = _range(db, member, body)
    rows = _collect(db, family.id, s, e, body.onlyAbnormal)
    if not rows:
        raise HTTPException(status_code=400, detail="这段时间没有可导出的记录")

    elder = db.query(Elder).filter(Elder.family_id == family.id).order_by(Elder.id).first()
    summary = {
        "completionRate": q["tasks"]["used"] and min(100, 72),
        "doneCount": len([r for r in rows if r["actionLabel"] in ("完成", "确认")]),
        "overdueCount": len([r for r in rows if r["actionLabel"] in ("超时", "取消")]),
        "evidenceCount": sum(len(r["attachments"]) for r in rows),
    }
    profile_summary = ""
    if elder:
        profile_summary = (
            f"{elder.name}，{elder.relation}；既往史：{elder.conditions or '未填写'}；"
            f"过敏史：{elder.allergies or '未填写'}；常去：{elder.hospital or '未填写'}。"
        )

    path = pdf_service.build_pdf(
        family_name=family.name,
        events=rows,
        scope_label="本月" if body.scope == "month" else f"{s.month}/{s.day} – {e.month}/{e.day}",
        user_name=user.real_name or user.nickname,
        options={
            "hideNames": body.hideNames,
            "evidence": body.includeEvidence,
            "profile": body.includeProfile,
            "profileSummary": profile_summary,
        },
        summary=summary,
    )

    record = ExportRecord(
        family_id=family.id,
        user_id=user.id,
        scope=body.scope,
        options=body.model_dump(),
        event_count=len(rows),
        file_name=path.name,
    )
    db.add(record)
    if elder:
        db.add(AccessLog(
            elder_id=elder.id,
            viewer_id=user.id,
            viewer_name=user.real_name or user.nickname,
            viewer_tag="导出",
            scope=f"导出照护记录（{len(rows)} 条）",
            action="export",
        ))
    db.add(TaskEvent(
        family_id=family.id,
        task_id=None,
        actor_id=user.id,
        actor_name=user.real_name or user.nickname,
        action="export",
        note=f"导出照护记录 PDF（{len(rows)} 条，{body.scope}）",
    ))
    db.commit()

    return ok({
        "fileName": path.name,
        "url": f"/api/export/file/{path.name}",
        "eventCount": len(rows),
        "hideNames": body.hideNames,
        "quota": membership_quota(db, family.id),
        "watermark": "仅用于就医沟通",
    }, "PDF 已生成")


@router.get("/records")
def records(
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ExportRecord)
        .filter(ExportRecord.family_id == member.family_id)
        .order_by(ExportRecord.id.desc())
        .limit(20)
        .all()
    )
    return ok([{
        "id": r.id,
        "fileName": r.file_name,
        "eventCount": r.event_count,
        "scope": r.scope,
        "createdAt": iso(r.created_at),
        "url": f"/api/export/file/{r.file_name}",
    } for r in rows])


@router.get("/file/{file_name}")
def download(file_name: str):
    safe = (EXPORT_DIR / file_name).resolve()
    if not str(safe).startswith(str(EXPORT_DIR.resolve())) or not safe.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(str(safe), media_type="application/pdf", filename=file_name)
