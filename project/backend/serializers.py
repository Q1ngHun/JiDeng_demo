"""模型 → 前端 JSON 的序列化。集中在一处，保证 15 屏字段一致。"""
from datetime import datetime

from models import (
    Attachment, Elder, FamilyMember, Medication, Report, Task, TaskEvent, User,
)
from utils import (
    STATUS_META, human_day, human_dt, iso, progress_percent, relative_day_label, remaining_text,
)


def user_brief(u: User):
    if not u:
        return None
    return {
        "id": u.id,
        "name": u.real_name or u.nickname,
        "realName": u.real_name,
        "nickname": u.nickname,
        "avatarText": u.avatar_text,
        "avatarColor": u.avatar_color,
        "role": u.role,
        "phone": u.phone,
    }


def member_brief(m: FamilyMember):
    u = m.user
    return {
        "id": m.id,
        "userId": m.user_id,
        "name": (u.real_name or u.nickname) if u else "",
        "relation": m.relation,
        "role": m.role,
        "avatarText": u.avatar_text if u else "",
        "avatarColor": u.avatar_color if u else "",
        "status": m.status,
        "permissions": {
            "meds": m.can_view_meds,
            "history": m.can_view_history,
            "reports": m.can_view_reports,
        },
    }


def elder_brief(e: Elder):
    if not e:
        return None
    from utils import today
    age = None
    if e.birthday:
        try:
            b = datetime.strptime(e.birthday, "%Y-%m-%d").date()
            age = today().year - b.year - ((today().month, today().day) < (b.month, b.day))
        except ValueError:
            age = None
    return {
        "id": e.id,
        "name": e.name,
        "relation": e.relation,
        "gender": e.gender,
        "birthday": e.birthday,
        "age": age,
        "height": e.height,
        "weight": e.weight,
        "bloodType": e.blood_type,
        "conditions": e.conditions,
        "allergies": e.allergies,
        "hospital": e.hospital,
        "doctor": e.doctor,
        "nextCheckup": iso(e.next_checkup_at),
        "completeness": e.completeness,
        "avatarColor": e.avatar_color,
    }


def attachment_dict(a: Attachment):
    return {
        "id": a.id,
        "kind": a.kind,
        "url": a.url,
        "duration": a.duration,
        "createdAt": iso(a.created_at),
    }


def task_dict(t: Task, with_detail: bool = False):
    meta = STATUS_META.get(t.status, {"label": t.status, "tone": "mute"})
    remain = ""
    progress = 100
    if t.status in ("in_progress", "claimed", "pending_claim"):
        if t.due_at:
            remain = remaining_text(t.due_at)
            start = t.started_at or t.claimed_at or t.created_at
            progress = progress_percent(start, t.due_at)
    attachments = list(t.attachments or [])
    data = {
        "id": t.id,
        "title": t.title,
        "category": t.category,
        "description": t.description or "",
        "status": t.status,
        "statusLabel": meta["label"],
        "tone": meta["tone"],
        "scheduledAt": iso(t.scheduled_at),
        "dueAt": iso(t.due_at),
        "dayLabel": human_day(t.scheduled_at.date()) if t.scheduled_at else "",
        "time": t.scheduled_at.strftime("%H:%M") if t.scheduled_at else "",
        "assignee": user_brief(t.assignee),
        "creator": user_brief(t.creator),
        "isUrgent": bool(t.is_urgent),
        "repeatRule": t.repeat_rule or "none",
        "location": t.location or "",
        "remindLabel": t.remind_label or "",
        "needConfirm": bool(t.need_confirm),
        "source": t.source,
        "remaining": remain,
        "progress": progress,
        "evidenceCount": len(attachments),
        "createdAt": iso(t.created_at),
        "claimedAt": iso(t.claimed_at),
        "startedAt": iso(t.started_at),
        "completedAt": iso(t.completed_at),
        "confirmedAt": iso(t.confirmed_at),
        "attachments": [attachment_dict(a) for a in attachments],
    }
    if with_detail:
        data["events"] = [event_dict(e) for e in sorted(t.events, key=lambda x: x.id) if hasattr(t, "events")]
    return data


ACTION_LABELS = {
    "create": "创建",
    "claim": "认领",
    "start": "开始",
    "complete": "完成",
    "confirm": "确认",
    "remind": "提醒",
    "reassign": "改派",
    "cancel": "取消",
    "timeout": "超时",
    "question": "有疑问",
    "attachment": "上传凭证",
    "export": "导出",
}


def event_dict(e: TaskEvent, with_task: bool = False):
    data = {
        "id": e.id,
        "taskId": e.task_id,
        "action": e.action,
        "actionLabel": ACTION_LABELS.get(e.action, e.action),
        "actorName": e.actor_name,
        "note": e.note or "",
        "fromStatus": e.from_status,
        "toStatus": e.to_status,
        "time": e.created_at.strftime("%H:%M") if e.created_at else "",
        "dateLabel": human_day(e.created_at.date()) if e.created_at else "",
        "relative": relative_day_label(e.created_at),
        "createdAt": iso(e.created_at),
        "tone": _event_tone(e.action),
        "title": _event_title(e),
    }
    if with_task:
        data["task"] = {
            "id": e.task.id if e.task else e.task_id,
            "title": e.task.title if e.task else "",
            "category": e.task.category if e.task else "",
        }
    return data


def _event_tone(action: str) -> str:
    if action in ("complete", "confirm", "claim", "start"):
        return "good"
    if action == "timeout":
        return "bad"
    if action in ("remind", "reassign", "cancel", "question", "attachment"):
        return "on"
    return ""


def _event_title(e: TaskEvent) -> str:
    name = e.actor_name or "系统"
    title = e.task.title if getattr(e, "task", None) else "任务"
    mapping = {
        "create": f"{name} 创建「{title}」",
        "claim": f"{name} 认领「{title}」",
        "start": f"{name} 开始「{title}」",
        "complete": f"{name} 完成「{title}」",
        "confirm": f"{name} 确认「{title}」",
        "remind": f"{name} 提醒了责任人「{title}」",
        "reassign": f"{name} 改派「{title}」",
        "cancel": f"{name} 取消「{title}」",
        "timeout": f"「{title}」已超时",
        "question": f"{name} 对「{title}」有疑问",
        "attachment": f"{name} 上传了「{title}」的凭证",
        "export": "导出照护记录",
    }
    return mapping.get(e.action, f"{name} {e.action}「{title}」")


def med_dict(m: Medication):
    total = max(1, m.total_days or 1)
    percent = int(max(0, min(100, m.remaining_days / total * 100)))
    return {
        "id": m.id,
        "name": m.name,
        "dosage": m.dosage,
        "frequency": m.frequency,
        "timing": m.timing,
        "startDate": iso(m.start_date),
        "endDate": iso(m.end_date),
        "remainingDays": m.remaining_days,
        "remainingQty": m.remaining_qty,
        "totalDays": m.total_days,
        "percent": percent,
        "needBuy": m.status == "active" and m.remaining_days <= 14,
        "status": m.status,
        "note": m.note or "",
    }


def report_dict(r: Report):
    return {
        "id": r.id,
        "title": r.title,
        "takenAt": iso(r.taken_at),
        "dateLabel": f"{r.taken_at.month:02d}/{r.taken_at.day:02d}" if r.taken_at else "",
        "imageUrl": r.image_url or "",
        "abnormalCount": r.abnormal_count,
        "confidence": r.confidence,
        "indicators": r.indicators or [],
        "summaryAbnormal": r.summary_abnormal or "",
        "summaryMeaning": r.summary_meaning or "",
        "summaryAdvice": r.summary_advice or "",
        "questions": r.questions or [],
        "status": r.status,
        "statusLabel": "待问诊" if r.status == "pending_ask" else "已归档",
        "disclaimer": r.disclaimer or "",
        "createdAt": iso(r.created_at),
    }
