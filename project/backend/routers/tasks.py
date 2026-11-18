"""任务：看板、创建、详情、7 态流转与异常处理（FR-09 ~ FR-14）。"""
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from common import family_members, primary_elder
from config import UPLOAD_DIR
from db import get_db
from deps import current_family, current_member, current_user
from models import Attachment, Elder, Family, FamilyMember, Task, User
from response import ok
from serializers import member_brief, task_dict, user_brief
from services import tasks_service
from utils import (
    STATUS_META, beijing_now, human_day, iso, parse_dt, today, week_start,
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

TEMPLATES = [
    {"key": "recheck", "title": "陪爸爸去市一院心内科复查", "category": "复查",
     "hint": "带化验单、医保卡", "location": "市一院 3 号楼", "durationHours": 3},
    {"key": "pickup", "title": "去社区医院取降压药", "category": "取药",
     "hint": "带医保卡", "location": "社区医院", "durationHours": 2},
    {"key": "bp", "title": "量血压并记录", "category": "测量",
     "hint": "静坐 5 分钟再量", "location": "家里", "durationHours": 1},
    {"key": "bill", "title": "交水电费", "category": "缴费",
     "hint": "每月 20 号", "location": "", "durationHours": 2},
    {"key": "medicine", "title": "提醒吃降压药", "category": "用药",
     "hint": "早饭后 1 片", "location": "家里", "durationHours": 1},
    {"key": "checkup", "title": "空腹体检", "category": "复查",
     "hint": "体检需空腹、带身份证", "location": "市一院体检中心", "durationHours": 4},
]


class TaskBody(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    category: str = "其他"
    description: str = ""
    date: str = ""
    time: str = "09:00"
    scheduledAt: str = ""
    durationHours: float = 3
    assigneeId: Optional[int] = None
    elderId: Optional[int] = None
    repeatRule: str = "none"
    repeatUntil: Optional[str] = None
    isUrgent: bool = False
    location: str = ""
    remindLabel: str = "提前 1 天 20:00"
    needConfirm: bool = True
    note: str = ""


class CompleteBody(BaseModel):
    note: str = ""
    attachments: List[dict] = []


class NoteBody(BaseModel):
    note: str = ""


class ReassignBody(BaseModel):
    assigneeId: int
    reason: str = ""


class CancelBody(BaseModel):
    reason: str


@router.get("/meta")
def meta(
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    members = family_members(db, member.family_id)
    elder = db.query(Elder).filter_by(family_id=member.family_id).first()
    return ok({
        "categories": ["复查", "取药", "测量", "缴费", "用药", "其他"],
        "members": [member_brief(m) for m in members],
        "templates": TEMPLATES,
        "repeatOptions": [
            {"key": "none", "label": "不重复"},
            {"key": "daily", "label": "每天"},
            {"key": "weekly", "label": "每周"},
            {"key": "monthly", "label": "每月 20 号"},
        ],
        "remindOptions": ["提前 1 天 20:00", "提前 2 小时", "到点提醒", "提前 30 分钟"],
        "statuses": [{"key": k, "label": v["label"], "tone": v["tone"]} for k, v in STATUS_META.items()],
        "elder": {"id": elder.id, "name": elder.name} if elder else None,
    })


@router.get("")
def list_tasks(
    range_type: str = Query("week", alias="range"),
    day: Optional[str] = None,
    filter: str = Query("all"),  # all / mine / pending_claim
    status: Optional[str] = None,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    tasks_service.refresh_overdue(db)
    today_date = today()
    if day:
        start = end = parse_dt(day).date()
    elif range_type == "today":
        start = end = today_date
    elif range_type == "all":
        start, end = today_date - timedelta(days=365), today_date + timedelta(days=365)
    else:
        start = week_start(today_date)
        end = start + timedelta(days=6)

    q = (
        db.query(Task)
        .filter(Task.family_id == member.family_id)
        .filter(Task.scheduled_at >= datetime.combine(start, time.min))
        .filter(Task.scheduled_at <= datetime.combine(end, time.max))
        .filter(Task.status.notin_(["cancelled", "skipped"]))
    )
    if status:
        q = q.filter(Task.status == status)
    all_tasks = q.order_by(Task.scheduled_at).all()

    mine = [t for t in all_tasks if t.assignee_id == member.user_id]
    pending = [t for t in all_tasks if t.status == "pending_claim"]
    if filter == "mine":
        shown = mine
    elif filter == "pending_claim":
        shown = pending
    else:
        shown = all_tasks

    days = []
    cursor = start
    while cursor <= end:
        items = [t for t in shown if t.scheduled_at.date() == cursor]
        all_of_day = [t for t in all_tasks if t.scheduled_at.date() == cursor]
        days.append({
            "date": iso(cursor),
            "label": human_day(cursor),
            "short": f"{cursor.month}/{cursor.day}",
            "weekday": ["一", "二", "三", "四", "五", "六", "日"][cursor.weekday()],
            "dayNumber": cursor.day,
            "isToday": cursor == today_date,
            "isWeekend": cursor.weekday() >= 5,
            "hasOpen": any(t.status not in ("done", "cancelled", "skipped") for t in all_of_day),
            "count": len(items),
            "totalCount": len(all_of_day),
            "tasks": [task_dict(t) for t in items],
        })
        cursor += timedelta(days=1)

    week_start_date = week_start(today_date)
    week_days = []
    for i in range(7):
        d = week_start_date + timedelta(days=i)
        week_days.append({
            "date": iso(d),
            "weekday": ["一", "二", "三", "四", "五", "六", "日"][i],
            "dayNumber": d.day,
            "isToday": d == today_date,
            "hasOpen": any(
                t.scheduled_at.date() == d and t.status not in ("done", "cancelled", "skipped")
                for t in db.query(Task).filter(
                    Task.family_id == member.family_id,
                    Task.scheduled_at >= datetime.combine(d, time.min),
                    Task.scheduled_at <= datetime.combine(d, time.max),
                ).all()
            ),
        })

    return ok({
        "range": range_type,
        "filter": filter,
        "filters": [
            {"key": "all", "label": "全部", "count": len(all_tasks)},
            {"key": "mine", "label": "我的", "count": len(mine)},
            {"key": "pending_claim", "label": "待认领", "count": len(pending)},
        ],
        "days": days,
        "weekDays": week_days,
        "total": len(shown),
    })


@router.post("")
def create_task(
    body: TaskBody,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    payload = body.model_dump()
    if not payload.get("elderId"):
        elder = db.query(Elder).filter_by(family_id=family.id).first()
        payload["elderId"] = elder.id if elder else None
    task = tasks_service.create_task(db, family.id, user, payload)
    return ok(task_dict(task), "已派发并通知")


@router.get("/{task_id}")
def detail(
    task_id: int,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    tasks_service.refresh_overdue(db)
    task = db.get(Task, task_id)
    if not task or task.family_id != member.family_id:
        raise HTTPException(status_code=404, detail="任务不存在")
    data = task_dict(task, with_detail=True)
    data["events"] = [e for e in data.get("events", [])]
    open_task = task.status not in ("done", "cancelled", "skipped")
    is_owner = member.role == "owner"
    is_assignee = task.assignee_id == member.user_id
    data["permissions"] = {
        "canClaim": task.status in ("pending_claim", "overdue", "question")
        and task.assignee_id in (None, member.user_id),
        "canStart": task.status in ("claimed", "pending_claim", "overdue", "question")
        and task.assignee_id in (None, member.user_id),
        "canComplete": task.status in ("claimed", "in_progress", "overdue") and is_assignee,
        "canConfirm": task.status == "pending_confirm" and (is_owner or task.creator_id == member.user_id),
        "canReassign": is_owner and open_task,
        "canRemind": open_task,
        "canCancel": is_owner and open_task,
        "canSkip": task.repeat_rule != "none" and open_task,
        "canUpload": is_assignee and open_task,
        "canAsk": is_assignee,
    }
    data["reminderPlan"] = "到点提醒责任人 → 2 小时后提醒主理 → 24 小时后标记超时"
    if task.due_at:
        from utils import remaining_text
        data["remaining"] = remaining_text(task.due_at)
    return ok(data)


@router.post("/{task_id}/claim")
def claim(task_id: int, user: User = Depends(current_user), member: FamilyMember = Depends(current_member),
          db: Session = Depends(get_db)):
    task = _get(db, task_id, member)
    task = tasks_service.claim(db, task, user)
    return ok(task_dict(task), "已认领")


@router.post("/{task_id}/start")
def start(task_id: int, user: User = Depends(current_user), member: FamilyMember = Depends(current_member),
          db: Session = Depends(get_db)):
    task = _get(db, task_id, member)
    task = tasks_service.start(db, task, user)
    return ok(task_dict(task), "已开始")


@router.post("/{task_id}/complete")
def complete(task_id: int, body: CompleteBody, user: User = Depends(current_user),
             member: FamilyMember = Depends(current_member), db: Session = Depends(get_db)):
    task = _get(db, task_id, member)
    task = tasks_service.complete(db, task, user, body.note, body.attachments)
    return ok(task_dict(task), "已提交，等待主理确认" if task.status == "pending_confirm" else "已完成")


@router.post("/{task_id}/confirm")
def confirm(task_id: int, body: NoteBody = NoteBody(), user: User = Depends(current_user),
            member: FamilyMember = Depends(current_member), db: Session = Depends(get_db)):
    task = _get(db, task_id, member)
    if member.role != "owner" and task.creator_id != user.id:
        raise HTTPException(status_code=403, detail="仅主理子女可确认完成")
    task = tasks_service.confirm(db, task, user, body.note)
    return ok(task_dict(task), "已确认完成")


@router.post("/{task_id}/remind")
def remind(task_id: int, user: User = Depends(current_user), member: FamilyMember = Depends(current_member),
           db: Session = Depends(get_db)):
    task = _get(db, task_id, member)
    task = tasks_service.remind(db, task, user)
    return ok(task_dict(task), "已提醒责任人")


@router.post("/{task_id}/reassign")
def reassign(task_id: int, body: ReassignBody, user: User = Depends(current_user),
             member: FamilyMember = Depends(current_member), db: Session = Depends(get_db)):
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可改派")
    task = _get(db, task_id, member)
    task = tasks_service.reassign(db, task, user, body.assigneeId, body.reason)
    return ok(task_dict(task), "已改派")


@router.post("/{task_id}/cancel")
def cancel(task_id: int, body: CancelBody, user: User = Depends(current_user),
           member: FamilyMember = Depends(current_member), db: Session = Depends(get_db)):
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可取消任务")
    task = _get(db, task_id, member)
    task = tasks_service.cancel(db, task, user, body.reason)
    return ok(task_dict(task), "已取消并说明")


@router.post("/{task_id}/skip")
def skip(task_id: int, body: NoteBody = NoteBody(), user: User = Depends(current_user),
         member: FamilyMember = Depends(current_member), db: Session = Depends(get_db)):
    task = _get(db, task_id, member)
    task = tasks_service.skip(db, task, user, body.note)
    return ok(task_dict(task), "已跳过本次")


@router.post("/{task_id}/question")
def question(task_id: int, body: NoteBody, user: User = Depends(current_user),
             member: FamilyMember = Depends(current_member), db: Session = Depends(get_db)):
    task = _get(db, task_id, member)
    task = tasks_service.question(db, task, user, body.note)
    return ok(task_dict(task), "已提问")


@router.post("/{task_id}/attachments")
async def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    kind: str = Form("image"),
    duration: int = Form(0),
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    task = _get(db, task_id, member)
    if task.assignee_id != user.id:
        raise HTTPException(status_code=403, detail="请先认领任务，再由责任人上传凭证")
    suffix = Path(file.filename or "upload.jpg").suffix or ".jpg"
    name = f"task{task.id}-{int(beijing_now().timestamp())}{suffix}"
    (UPLOAD_DIR / name).write_bytes(await file.read())
    db.add(Attachment(task_id=task.id, kind=kind, url=f"/uploads/{name}", duration=duration, uploaded_by=user.id))
    tasks_service.log_event(db, task, user, "attachment", "上传了凭证", task.status, task.status)
    db.commit()
    return ok({"url": f"/uploads/{name}"}, "凭证已上传")


def _get(db: Session, task_id: int, member: FamilyMember) -> Task:
    task = db.get(Task, task_id)
    if not task or task.family_id != member.family_id:
        raise HTTPException(status_code=404, detail="任务不存在")
    if member.role == "elder" and task.assignee_id not in (None, member.user_id):
        raise HTTPException(status_code=403, detail="只能操作自己的任务")
    return task
