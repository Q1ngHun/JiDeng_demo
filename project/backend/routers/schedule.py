"""家庭成员排班（§5.2）：7 天 × 成员二维表，色块只表示「有人负责」。"""
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from common import family_members
from db import get_db
from deps import current_family, current_member, current_user
from models import Family, FamilyMember, ScheduleSlot, Task, User
from response import ok
from serializers import member_brief
from services import tasks_service
from utils import iso, parse_dt, today, week_start

router = APIRouter(prefix="/api/schedule", tags=["schedule"])

WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]

# 排班建议：按关系给出默认分工（不涉及评分）
DEFAULT_ROLES = {
    "主理子女": ["缴费", "买药"],
    "妹妹": ["复查", "取药"],
    "爸爸": ["吃药打卡", "量血压"],
    "妈妈": ["吃药打卡"],
}


class SlotBody(BaseModel):
    memberId: int
    date: str
    hasDuty: Optional[bool] = None
    label: str = ""


class GenerateBody(BaseModel):
    weekStart: str = ""


@router.get("")
def get_schedule(
    weekStart: str = Query(""),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    start = parse_dt(weekStart).date() if weekStart else week_start(today())
    start = week_start(start)
    end = start + timedelta(days=6)

    members = family_members(db, member.family_id)
    rows = []
    for m in members:
        user = m.user
        cells = []
        for i in range(7):
            d = start + timedelta(days=i)
            slot = (
                db.query(ScheduleSlot)
                .filter(ScheduleSlot.family_id == member.family_id)
                .filter(ScheduleSlot.member_id == m.user_id)
                .filter(ScheduleSlot.day == d)
                .first()
            )
            cells.append({
                "date": iso(d),
                "hasDuty": bool(slot and slot.has_duty),
                "label": slot.label if slot else "",
            })
        duty_days = len([c for c in cells if c["hasDuty"]])
        rows.append({
            **member_brief(m),
            "cells": cells,
            "dutyDays": duty_days,
            "isElder": m.role == "elder",
        })

    slots = (
        db.query(ScheduleSlot)
        .filter(ScheduleSlot.family_id == member.family_id)
        .filter(ScheduleSlot.day >= start)
        .filter(ScheduleSlot.day <= end)
        .filter(ScheduleSlot.has_duty == True)  # noqa: E712
        .all()
    )
    duties = []
    for s in slots:
        owner = db.get(User, s.member_id)
        duties.append({
            "id": s.id,
            "memberId": s.member_id,
            "memberName": (owner.real_name or owner.nickname) if owner else "",
            "date": iso(s.day),
            "label": s.label,
            "dayLabel": f"周{WEEKDAYS[s.day.weekday()]} · {s.label}",
        })

    days = [{
        "date": iso(start + timedelta(days=i)),
        "weekday": WEEKDAYS[i],
        "dayNumber": (start + timedelta(days=i)).day,
        "isToday": (start + timedelta(days=i)) == today(),
        "isWeekend": i >= 5,
    } for i in range(7)]

    return ok({
        "weekStart": iso(start),
        "weekEnd": iso(end),
        "weekLabel": f"本周 {start.month}/{start.day} – {end.month}/{end.day}",
        "days": days,
        "members": rows,
        "duties": duties,
        "autoSuggestion": True,
        "notice": "排班只是建议。长辈端看到的永远是「今天做什么」，不会看到「谁哪天没排班」。",
        "canEdit": member.role == "owner",
    })


@router.post("/slot")
def toggle_slot(
    body: SlotBody,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可排班")
    d = parse_dt(body.date).date()
    slot = (
        db.query(ScheduleSlot)
        .filter(ScheduleSlot.family_id == member.family_id)
        .filter(ScheduleSlot.member_id == body.memberId)
        .filter(ScheduleSlot.day == d)
        .first()
    )
    target = body.hasDuty if body.hasDuty is not None else not (slot.has_duty if slot else False)
    if not slot:
        slot = ScheduleSlot(family_id=member.family_id, member_id=body.memberId, day=d)
        db.add(slot)
    slot.has_duty = target
    if body.label:
        slot.label = body.label
    elif target and not slot.label:
        owner = db.get(User, body.memberId)
        relation = ""
        fm = db.query(FamilyMember).filter_by(family_id=member.family_id, user_id=body.memberId).first()
        relation = fm.relation if fm else ""
        slot.label = (DEFAULT_ROLES.get(relation) or ["家务"])[0]
    db.commit()
    return ok({"date": iso(d), "hasDuty": bool(slot.has_duty), "label": slot.label}, "已更新排班")


@router.post("/auto")
def auto_assign(
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    """按分工建议重排本周（演示用规则，不涉及评分）。"""
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可重排")
    start = week_start(today())
    members = family_members(db, family.id)
    db.query(ScheduleSlot).filter(
        ScheduleSlot.family_id == family.id,
        ScheduleSlot.day >= start,
        ScheduleSlot.day <= start + timedelta(days=6),
    ).delete(synchronize_session=False)

    counters = {m.user_id: 0 for m in members}
    for i in range(7):
        d = start + timedelta(days=i)
        for idx, m in enumerate(members):
            has_duty = (i + idx) % 2 == 0 or (i >= 5 and idx == 0)
            label_pool = DEFAULT_ROLES.get(m.relation) or ["家务"]
            db.add(ScheduleSlot(
                family_id=family.id,
                member_id=m.user_id,
                day=d,
                has_duty=has_duty,
                label=label_pool[counters[m.user_id] % len(label_pool)] if has_duty else "",
            ))
            if has_duty:
                counters[m.user_id] += 1
    db.commit()
    return ok(True, "已重新分配")


@router.post("/generate-tasks")
def generate_tasks(
    body: GenerateBody,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    """把排班一键转成任务，避免排班与任务两套数据。"""
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可生成任务")
    start = parse_dt(body.weekStart).date() if body.weekStart else week_start(today())
    start = week_start(start)
    end = start + timedelta(days=6)
    slots = db.query(ScheduleSlot).filter(
        ScheduleSlot.family_id == member.family_id,
        ScheduleSlot.day >= start,
        ScheduleSlot.day <= end,
        ScheduleSlot.has_duty == True,  # noqa: E712
    ).all()

    created = 0
    for s in slots:
        if not s.label:
            continue
        exists = db.query(Task).filter(
            Task.family_id == member.family_id,
            Task.assignee_id == s.member_id,
            Task.title.like(f"%{s.label}%"),
            Task.scheduled_at >= datetime.combine(s.day, time.min),
            Task.scheduled_at <= datetime.combine(s.day, time.max),
        ).first()
        if exists:
            continue
        scheduled = datetime.combine(s.day, time(hour=10))
        tasks_service.create_task(db, member.family_id, user, {
            "title": s.label,
            "category": "复查" if "复查" in s.label else ("取药" if "药" in s.label else "其他"),
            "scheduledAt": scheduled.strftime("%Y-%m-%dT%H:%M:%S"),
            "durationHours": 3,
            "assigneeId": s.member_id,
            "source": "schedule",
            "note": "由排班表生成",
        }, expand_repeat=False)
        created += 1
    return ok({"created": created}, f"已生成 {created} 条任务")
