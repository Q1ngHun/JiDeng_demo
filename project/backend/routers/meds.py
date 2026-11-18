"""用药清单与复诊周期（FR-16 / FR-17）。只记录，不给任何用药建议。"""
from datetime import datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from common import check_elder_access
from db import get_db
from deps import current_member, current_user
from models import Elder, FamilyMember, FollowUp, Medication, Task, User
from response import ok
from serializers import med_dict, task_dict
from services import tasks_service
from utils import beijing_now, iso, parse_date, today

router = APIRouter(prefix="/api", tags=["meds"])

NOTICE = "这里只记录「吃什么、怎么吃、还剩多少」。家灯不提供任何用药建议，也不调整剂量。"
FOLLOWUP_NOTICE = "复诊任务生成后会先「待你确认」，避免误排。药品剩余量按打卡记录推算，不是库存盘点。"


class MedBody(BaseModel):
    name: str
    dosage: str = ""
    frequency: str = "每日 1 次"
    timing: str = "早饭后"
    startDate: str = ""
    totalDays: int = 30
    remainingDays: Optional[int] = None
    remainingQty: Optional[int] = None
    note: str = ""


class FollowUpBody(BaseModel):
    title: str = "复查"
    cycleDays: int = 90
    lastDate: str = ""
    nextDate: str = ""


@router.get("/elders/{elder_id}/meds")
def list_meds(
    elder_id: int,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    elder = check_elder_access(db, member, elder_id)
    meds = (
        db.query(Medication)
        .filter(Medication.elder_id == elder.id)
        .order_by(Medication.status.asc(), Medication.id)
        .all()
    )
    followups = db.query(FollowUp).filter(FollowUp.elder_id == elder.id, FollowUp.is_active == True).all()  # noqa: E712
    return ok({
        "elder": {"id": elder.id, "name": elder.name},
        "medications": [med_dict(m) for m in meds],
        "followUps": [{
            "id": f.id,
            "title": f.title,
            "cycleDays": f.cycle_days,
            "cycleLabel": f"每 {f.cycle_days} 天" if f.cycle_days % 30 else f"每 {f.cycle_days // 30} 个月",
            "lastDate": iso(f.last_date),
            "nextDate": iso(f.next_date),
            "needConfirm": f.need_confirm,
            "note": "提前 7 天生成任务（需我确认）",
        } for f in followups],
        "notice": NOTICE,
        "followUpNotice": FOLLOWUP_NOTICE,
    })


@router.post("/elders/{elder_id}/meds")
def create_med(
    elder_id: int,
    body: MedBody,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    elder = check_elder_access(db, member, elder_id)
    if member.role not in ("owner", "member"):
        raise HTTPException(status_code=403, detail="长辈端不可编辑用药")
    # 剩余天数与剩余片数保持同一口径：只填剩余天数时，不再用默认 30 天当作片数
    remaining_days = body.remainingDays if body.remainingDays is not None else body.totalDays
    remaining_qty = body.remainingQty if body.remainingQty is not None else remaining_days
    total_days = max(int(body.totalDays or 0), int(remaining_days or 0), 1)
    med = Medication(
        elder_id=elder.id,
        name=body.name,
        dosage=body.dosage,
        frequency=body.frequency,
        timing=body.timing,
        start_date=parse_date(body.startDate) if body.startDate else today(),
        total_days=total_days,
        remaining_days=remaining_days,
        remaining_qty=remaining_qty,
        note=body.note,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return ok(med_dict(med), "已添加")


@router.post("/meds/{med_id}/take")
def take(
    med_id: int,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    """吃药打卡：按打卡推算剩余量，扣减到 0 提醒。"""
    med = db.get(Medication, med_id)
    if not med:
        raise HTTPException(status_code=404, detail="药品不存在")
    check_elder_access(db, member, med.elder_id)
    if med.status != "active":
        raise HTTPException(status_code=400, detail="该药已停用")
    med.remaining_days = max(0, med.remaining_days - 1)
    med.remaining_qty = max(0, med.remaining_qty - 1)
    db.commit()
    db.refresh(med)
    msg = "已打卡" if med.remaining_days > 0 else "已打卡，药快用完了"
    return ok(med_dict(med), msg)


@router.post("/meds/{med_id}/refill-task")
def create_refill_task(
    med_id: int,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    """剩余量不足时生成「该买药了」任务。"""
    med = db.get(Medication, med_id)
    if not med:
        raise HTTPException(status_code=404, detail="药品不存在")
    elder = check_elder_access(db, member, med.elder_id)
    scheduled = datetime.combine(today(), time(hour=18))
    task = tasks_service.create_task(db, member.family_id, user, {
        "title": f"去社区医院取{med.name}",
        "category": "取药",
        "scheduledAt": scheduled.strftime("%Y-%m-%dT%H:%M:%S"),
        "durationHours": 3,
        "elderId": elder.id,
        "source": "medication",
        "note": f"由用药清单生成（剩 {med.remaining_days} 天）",
        "remindLabel": "提前 2 小时",
    }, expand_repeat=False)
    return ok(task_dict(task), "已生成「该买药了」任务")


@router.post("/meds/{med_id}/stop")
def stop_med(
    med_id: int,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    med = db.get(Medication, med_id)
    if not med:
        raise HTTPException(status_code=404, detail="药品不存在")
    check_elder_access(db, member, med.elder_id)
    med.status = "stopped"
    med.end_date = today()
    db.commit()
    return ok(med_dict(med), "已停用，记录保留")


@router.post("/elders/{elder_id}/follow-ups")
def create_followup(
    elder_id: int,
    body: FollowUpBody,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    elder = check_elder_access(db, member, elder_id)
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="复诊周期需主理子女确认")
    fu = FollowUp(
        elder_id=elder.id,
        title=body.title,
        cycle_days=body.cycleDays,
        last_date=parse_date(body.lastDate) if body.lastDate else today(),
        next_date=parse_date(body.nextDate) if body.nextDate else today() + timedelta(days=body.cycleDays),
        need_confirm=True,
    )
    db.add(fu)
    db.commit()
    return ok({"id": fu.id}, "已设置复诊周期")


@router.patch("/follow-ups/{followup_id}")
def patch_followup(
    followup_id: int,
    body: FollowUpBody,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    fu = db.get(FollowUp, followup_id)
    if not fu:
        raise HTTPException(status_code=404, detail="复诊周期不存在")
    check_elder_access(db, member, fu.elder_id)
    fu.title = body.title
    fu.cycle_days = body.cycleDays
    if body.lastDate:
        fu.last_date = parse_date(body.lastDate)
    if body.nextDate:
        fu.next_date = parse_date(body.nextDate)
    db.commit()
    return ok({"id": fu.id}, "已修改复诊周期")


@router.post("/follow-ups/{followup_id}/generate-task")
def generate_followup_task(
    followup_id: int,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    """复诊任务生成后先「待你确认」，避免长辈白跑一趟。"""
    fu = db.get(FollowUp, followup_id)
    if not fu:
        raise HTTPException(status_code=404, detail="复诊周期不存在")
    elder = check_elder_access(db, member, fu.elder_id)
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="需主理子女确认")
    scheduled = datetime.combine(fu.next_date or (today() + timedelta(days=7)), time(hour=9))
    task = tasks_service.create_task(db, member.family_id, user, {
        "title": f"陪{elder.relation}{elder.name[:1]}去{elder.hospital or '医院'}{fu.title}",
        "category": "复查",
        "scheduledAt": scheduled.strftime("%Y-%m-%dT%H:%M:%S"),
        "durationHours": 4,
        "elderId": elder.id,
        "source": "followup",
        "note": "由复诊周期生成，需我确认",
    }, expand_repeat=False)
    task.need_confirm = True
    db.commit()
    return ok(task_dict(task), "已生成待确认的复诊任务")
