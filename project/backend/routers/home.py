"""首页 · 今日总览（FR-27 安心概览）。"""
from datetime import datetime, time, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from common import family_members, primary_elder
from config import APP_VERSION
from db import get_db
from deps import current_family, current_member, current_user
from models import Elder, Family, FamilyMember, Membership, Task, User, UserSetting, WidgetSetting
from response import ok
from serializers import member_brief, task_dict, user_brief
from services import tasks_service
from utils import STATUS_META, beijing_now, greeting, human_day, iso, today

router = APIRouter(prefix="/api/home", tags=["home"])

QUICK_ACTIONS = [
    {"key": "create", "label": "派任务", "icon": "plus", "path": "/pages/create/create"},
    {"key": "report", "label": "读报告", "icon": "camera", "path": "/pages/report/report"},
    {"key": "schedule", "label": "排班", "icon": "cal", "path": "/pages/schedule/schedule"},
    {"key": "export", "label": "导出", "icon": "doc", "path": "/pages/export/export"},
]


@router.get("")
def home(
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    tasks_service.refresh_overdue(db)

    setting = db.query(UserSetting).filter_by(user_id=user.id).first()
    elder = db.query(Elder).filter(Elder.family_id == family.id).order_by(Elder.id).first()
    stats = tasks_service.task_stats(db, family.id)

    day = today()
    task_query = (
        db.query(Task)
        .filter(Task.family_id == family.id)
        .filter(Task.scheduled_at >= datetime.combine(day, time.min))
        .filter(Task.scheduled_at <= datetime.combine(day, time.max))
        .filter(Task.status.notin_(["cancelled", "skipped"]))
    )
    if member.role == "elder":
        # 长辈端只看「今天我要做什么」，不参与家庭分工判断
        task_query = task_query.filter(
            (Task.assignee_id == member.user_id) | (Task.assignee_id == None)  # noqa: E711
        )
    today_tasks = task_query.order_by(Task.scheduled_at).all()

    members = family_members(db, family.id)
    connect_days = max(1, (beijing_now() - (family.created_at or beijing_now())).days + 1)

    next_checkup_days = None
    if elder and elder.next_checkup_at:
        next_checkup_days = (elder.next_checkup_at - day).days

    membership = db.query(Membership).filter(Membership.family_id == family.id).order_by(Membership.id.desc()).first()
    is_vip = bool(membership and membership.expires_at and membership.expires_at > beijing_now())

    return ok({
        "greeting": greeting(),
        "userName": user.real_name or user.nickname,
        "user": user_brief(user),
        "dateLabel": human_day(day),
        "connectDays": connect_days,
        "sync": {
            "online": True,
            "label": "已同步",
            "lastSyncAt": iso(setting.last_sync_at) if setting else iso(beijing_now()),
            "lastSyncLabel": "今天 " + (setting.last_sync_at.strftime("%H:%M") if setting else beijing_now().strftime("%H:%M")),
            "cachedTasks": setting.offline_cached_tasks if setting else 34,
            "tip": "离线也可查看与打卡",
        },
        "members": [member_brief(m) for m in members],
        "stats": stats,
        "kpi": {
            **stats["kpi"],
            "nextCheckupDays": next_checkup_days,
            "nextCheckupLabel": "下次复查",
        },
        "todayTasks": [task_dict(t) for t in today_tasks],
        "todaySummary": {
            "total": len(today_tasks),
            "done": len([t for t in today_tasks if t.status == "done"]),
        },
        "quickActions": QUICK_ACTIONS,
        "elder": {
            "id": elder.id if elder else None,
            "name": elder.name if elder else "",
            "nextCheckup": iso(elder.next_checkup_at) if elder else "",
        },
        "membership": {"plan": "vip" if is_vip else "free"},
        "version": APP_VERSION,
    })


@router.get("/widget")
def widget(
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    """桌面小组件数据：只放任务，不放健康数据（R7）。"""
    setting = db.query(WidgetSetting).filter_by(user_id=user.id).first()
    day = today()
    tasks = (
        db.query(Task)
        .filter(Task.family_id == family.id)
        .filter(Task.scheduled_at >= datetime.combine(day, time.min))
        .filter(Task.scheduled_at <= datetime.combine(day, time.max))
        .filter(Task.status.notin_(["done", "cancelled", "skipped"]))
        .order_by(Task.scheduled_at)
        .limit(3)
        .all()
    )
    pending = db.query(Task).filter(
        Task.family_id == family.id, Task.status == "pending_claim",
        Task.scheduled_at >= datetime.combine(day, time.min),
    ).count()
    return ok({
        "size": setting.size if setting else "medium",
        "familyName": family.name,
        "dateLabel": f"{day.month}/{day.day}",
        "pendingCount": pending,
        "tasks": [task_dict(t) for t in tasks],
    })
