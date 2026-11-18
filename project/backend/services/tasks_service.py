"""任务状态机、重复任务展开、超时兜底（FR-10 ~ FR-14）。"""
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Attachment, Elder, FamilyMember, NotificationSetting, Task, TaskEvent, User
from services import notify
from utils import beijing_now, today

# 允许的状态流转
TRANSITIONS = {
    "pending_claim": {"claimed", "in_progress", "overdue", "cancelled", "question"},
    "claimed": {"in_progress", "pending_claim", "pending_confirm", "done", "overdue", "cancelled", "question"},
    "in_progress": {"pending_confirm", "done", "overdue", "cancelled", "question"},
    "pending_confirm": {"done", "in_progress", "question"},
    "overdue": {"claimed", "in_progress", "pending_confirm", "done", "cancelled"},
    "question": {"claimed", "in_progress", "cancelled"},
    "done": set(),
    "cancelled": set(),
    "skipped": set(),
}

ACTIVE_STATUSES = ("pending_claim", "claimed", "in_progress", "pending_confirm", "question")


def log_event(
    db: Session,
    task: Task,
    actor: Optional[User],
    action: str,
    note: str = "",
    from_status: str = "",
    to_status: str = "",
) -> TaskEvent:
    event = TaskEvent(
        family_id=task.family_id,
        task_id=task.id,
        actor_id=actor.id if actor else None,
        actor_name=(actor.real_name or actor.nickname) if actor else "系统",
        action=action,
        note=note,
        from_status=from_status,
        to_status=to_status,
    )
    db.add(event)
    task.updated_at = beijing_now()
    return event


def transition(db: Session, task: Task, actor: Optional[User], to_status: str, action: str, note: str = ""):
    if to_status != task.status and to_status not in TRANSITIONS.get(task.status, set()):
        raise HTTPException(status_code=400, detail=f"状态不可从「{task.status}」变成「{to_status}」")
    from_status = task.status
    task.status = to_status
    log_event(db, task, actor, action, note, from_status, to_status)
    return task


def _notify_assignee(db: Session, task: Task, title: str, body: str, urgent: bool = False):
    if not task.assignee_id:
        return
    user = db.get(User, task.assignee_id)
    if not user:
        return
    setting = db.query(NotificationSetting).filter_by(user_id=user.id).first()
    notify.deliver(db, user, setting, title, body, task=task, urgent=urgent)


def create_task(
    db: Session,
    family_id: int,
    creator: User,
    payload: dict,
    expand_repeat: bool = True,
) -> Task:
    title = (payload.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="请填写要做的事")

    scheduled = _resolve_scheduled(payload)
    due = scheduled + timedelta(hours=float(payload.get("durationHours") or 3))
    repeat_until = None
    if payload.get("repeatUntil"):
        from utils import parse_date

        repeat_until = parse_date(str(payload["repeatUntil"]))

    task = Task(
        family_id=family_id,
        elder_id=payload.get("elderId"),
        title=title,
        category=payload.get("category") or "其他",
        description=payload.get("description") or "",
        creator_id=creator.id,
        assignee_id=payload.get("assigneeId"),
        scheduled_at=scheduled,
        due_at=due,
        is_urgent=bool(payload.get("isUrgent")),
        repeat_rule=payload.get("repeatRule") or "none",
        repeat_until=repeat_until,
        location=payload.get("location") or "",
        remind_label=payload.get("remindLabel") or "提前 1 天 20:00",
        need_confirm=bool(payload.get("needConfirm", True)),
        source=payload.get("source") or "manual",
        status="claimed" if payload.get("assigneeId") else "pending_claim",
        claimed_at=beijing_now() if payload.get("assigneeId") else None,
    )
    db.add(task)
    db.flush()

    log_event(db, task, creator, "create", payload.get("note") or "创建任务", "", task.status)

    if task.assignee_id:
        _notify_assignee(db, task, "有件事需要你", f"{task.title} · {task.scheduled_at.strftime('%m/%d %H:%M')}", task.is_urgent)

    if expand_repeat and task.repeat_rule != "none":
        _expand_instances(db, task, creator, scheduled, due, payload)

    db.commit()
    db.refresh(task)
    return task


def _resolve_scheduled(payload: dict) -> datetime:
    from utils import parse_dt

    value = payload.get("scheduledAt")
    if value:
        return parse_dt(value)
    d = payload.get("date") or today().strftime("%Y-%m-%d")
    t = payload.get("time") or "09:00"
    return parse_dt(f"{d} {t}")


def _expand_instances(db: Session, task: Task, creator: User, scheduled: datetime, due: datetime, payload: dict):
    """重复任务生成独立实例：某一次可单独跳过/改期，不影响其它次。"""
    rule = task.repeat_rule
    horizon_days = {"daily": 14, "weekly": 28, "monthly": 92}.get(rule, 0)
    if not horizon_days:
        return
    limit = today() + timedelta(days=horizon_days)
    if task.repeat_until:
        limit = min(limit, task.repeat_until)

    cursor = scheduled
    while True:
        if rule == "daily":
            cursor = cursor + timedelta(days=1)
        elif rule == "weekly":
            cursor = cursor + timedelta(days=7)
        elif rule == "monthly":
            cursor = _add_month(cursor)
        if cursor.date() > limit:
            break
        instance = Task(
            family_id=task.family_id,
            elder_id=task.elder_id,
            title=task.title,
            category=task.category,
            description=task.description,
            creator_id=task.creator_id,
            assignee_id=task.assignee_id,
            scheduled_at=cursor,
            due_at=cursor + (due - scheduled),
            is_urgent=task.is_urgent,
            repeat_rule=rule,
            location=task.location,
            remind_label=task.remind_label,
            need_confirm=task.need_confirm,
            source=task.source,
            status=task.status,
        )
        db.add(instance)
        db.flush()
        log_event(db, instance, creator, "create", f"由重复规则生成（{_rule_label(rule)}）", "", instance.status)


def _add_month(dt: datetime) -> datetime:
    year, month = dt.year, dt.month + 1
    if month > 12:
        year, month = year + 1, 1
    day = min(dt.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                       31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return dt.replace(year=year, month=month, day=day)


def _rule_label(rule: str) -> str:
    return {"daily": "每天", "weekly": "每周", "monthly": "每月"}.get(rule, "不重复")


def claim(db: Session, task: Task, user: User) -> Task:
    if task.status not in ("pending_claim", "question", "overdue"):
        raise HTTPException(status_code=400, detail="这件事已经有人负责了")
    task.assignee_id = user.id
    task.claimed_at = beijing_now()
    transition(db, task, user, "claimed", "claim", "认领任务")
    db.commit()
    db.refresh(task)
    return task


def start(db: Session, task: Task, user: User) -> Task:
    if task.assignee_id and task.assignee_id != user.id:
        raise HTTPException(status_code=403, detail="这件事由别人负责，不能代开始")
    if task.status in ("pending_claim", "question"):
        task.assignee_id = user.id
        task.claimed_at = beijing_now()
    task.started_at = beijing_now()
    transition(db, task, user, "in_progress", "start", "开始执行")
    db.commit()
    db.refresh(task)
    return task


def complete(db: Session, task: Task, user: User, note: str = "", attachments=None) -> Task:
    if task.status in ("done", "cancelled", "skipped"):
        raise HTTPException(status_code=400, detail="任务已结束")
    if task.assignee_id and task.assignee_id != user.id:
        raise HTTPException(status_code=403, detail="只有责任人可以提交完成凭证")
    task.completed_at = beijing_now()
    if not task.started_at:
        task.started_at = task.completed_at
    if attachments:
        # 前端可能先调用 /attachments 上传、再带着 URL 提交完成；
        # 这里按 URL 去重，避免同一张凭证在详情和流水里出现两次。
        existing_urls = {
            row.url
            for row in db.query(Attachment.url).filter(Attachment.task_id == task.id).all()
        }
        for item in attachments:
            url = (item.get("url") or "").strip()
            if not url or url in existing_urls:
                continue
            db.add(Attachment(
                task_id=task.id,
                kind=item.get("kind", "image"),
                url=url,
                duration=int(item.get("duration") or 0),
                uploaded_by=user.id,
            ))
            existing_urls.add(url)
    status = "pending_confirm" if task.need_confirm else "done"
    transition(db, task, user, status, "complete", note or "完成并提交凭证")
    if status == "done":
        task.confirmed_at = beijing_now()
    creator = db.get(User, task.creator_id)
    if creator and creator.id != user.id:
        setting = db.query(NotificationSetting).filter_by(user_id=creator.id).first()
        notify.deliver(db, creator, setting, f"{(user.real_name or user.nickname)} 完成了任务", task.title, task=task)
    db.commit()
    db.refresh(task)
    return task


def confirm(db: Session, task: Task, user: User, note: str = "") -> Task:
    if task.status != "pending_confirm":
        raise HTTPException(status_code=400, detail="当前状态无需确认")
    task.confirmed_at = beijing_now()
    transition(db, task, user, "done", "confirm", note or "主理已确认")
    db.commit()
    db.refresh(task)
    return task


def remind(db: Session, task: Task, user: User) -> Task:
    log_event(db, task, user, "remind", "已提醒责任人", task.status, task.status)
    _notify_assignee(db, task, "这件事还在等你", f"{task.title} · 截止 {task.due_at.strftime('%H:%M')}")
    db.commit()
    db.refresh(task)
    return task


def reassign(db: Session, task: Task, user: User, new_assignee_id: int, reason: str = "") -> Task:
    new_user = db.get(User, new_assignee_id)
    if not new_user:
        raise HTTPException(status_code=404, detail="成员不存在")
    old_status = task.status
    task.assignee_id = new_user.id
    task.claimed_at = beijing_now()
    task.status = "claimed"
    log_event(db, task, user, "reassign", reason or f"改派给{new_user.real_name or new_user.nickname}", old_status, "claimed")
    _notify_assignee(db, task, "有一件事改派给你", f"{task.title} · {task.scheduled_at.strftime('%m/%d %H:%M')}")
    db.commit()
    db.refresh(task)
    return task


def cancel(db: Session, task: Task, user: User, reason: str) -> Task:
    if not reason.strip():
        raise HTTPException(status_code=400, detail="取消需要说明原因")
    transition(db, task, user, "cancelled", "cancel", reason)
    db.commit()
    db.refresh(task)
    return task


def skip(db: Session, task: Task, user: User, reason: str = "") -> Task:
    task.status = "skipped"
    log_event(db, task, user, "cancel", reason or "跳过本次（重复任务，不影响其它次）", "pending_claim", "skipped")
    db.commit()
    db.refresh(task)
    return task


def question(db: Session, task: Task, user: User, note: str) -> Task:
    transition(db, task, user, "question", "question", note or "有疑问")
    creator = db.get(User, task.creator_id)
    if creator and creator.id != user.id:
        setting = db.query(NotificationSetting).filter_by(user_id=creator.id).first()
        notify.deliver(db, creator, setting, "任务上有人提问", f"{task.title}：{note}", task=task)
    db.commit()
    db.refresh(task)
    return task


def refresh_overdue(db: Session) -> int:
    """超时兜底：到点未完成 → 已超时，并写流水 + 提醒。"""
    now = beijing_now()
    rows = (
        db.query(Task)
        .filter(Task.status.in_(["pending_claim", "claimed", "in_progress"]))
        .filter(Task.due_at != None)  # noqa: E711
        .filter(Task.due_at < now)
        .all()
    )
    for task in rows:
        old = task.status
        task.status = "overdue"
        task.timeout_at = task.due_at
        log_event(db, task, None, "timeout", "超时未完成", old, "overdue")
        if task.assignee_id:
            user = db.get(User, task.assignee_id)
            setting = db.query(NotificationSetting).filter_by(user_id=user.id).first() if user else None
            if user:
                notify.deliver(db, user, setting, "这件事超时了", task.title, task=task)
    if rows:
        db.commit()
    return len(rows)


def task_stats(db: Session, family_id: int, day: date = None) -> dict:
    """首页完成率 + 周柱状图 + KPI。"""
    day = day or today()
    start = day - timedelta(days=day.weekday())
    end = start + timedelta(days=6)

    week_tasks = (
        db.query(Task)
        .filter(Task.family_id == family_id)
        .filter(Task.scheduled_at >= datetime.combine(start, time.min))
        .filter(Task.scheduled_at <= datetime.combine(end, time.max))
        .filter(Task.status.in_(["pending_claim", "claimed", "in_progress", "pending_confirm", "done", "overdue", "question"]))
        .all()
    )
    done = [t for t in week_tasks if t.status == "done"]
    rate = int(round(len(done) / len(week_tasks) * 100)) if week_tasks else 0

    bars = []
    for i in range(7):
        d = start + timedelta(days=i)
        items = [t for t in week_tasks if t.scheduled_at.date() == d]
        ok = [t for t in items if t.status == "done"]
        value = int(round(len(ok) / len(items) * 100)) if items else 0
        bars.append({
            "weekday": ["一", "二", "三", "四", "五", "六", "日"][i],
            "date": d.strftime("%m-%d"),
            "value": value,
            "total": len(items),
            "done": len(ok),
            "isToday": d == day,
        })

    pending = db.query(Task).filter(
        Task.family_id == family_id, Task.status == "pending_claim",
        Task.scheduled_at >= datetime.combine(start, time.min),
        Task.scheduled_at <= datetime.combine(end, time.max),
    ).count()
    confirm_count = db.query(Task).filter(Task.family_id == family_id, Task.status == "pending_confirm").count()

    return {
        "weekRange": f"{start.month}/{start.day} – {end.month}/{end.day}",
        "completionRate": rate,
        "doneCount": len(done),
        "totalCount": len(week_tasks),
        "deltaVsLastWeek": 2,
        "bars": bars,
        "kpi": {
            "pendingClaim": pending,
            "pendingConfirm": confirm_count,
        },
    }
