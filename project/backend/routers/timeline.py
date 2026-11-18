"""照护流水：只增不改，按天分组（FR-26）。"""
from datetime import datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import get_db
from deps import current_member
from models import FamilyMember, Task, TaskEvent
from response import ok
from serializers import event_dict, task_dict
from utils import human_day, iso

router = APIRouter(prefix="/api/timeline", tags=["timeline"])

FILTERS = [
    {"key": "all", "label": "全部"},
    {"key": "done", "label": "已完成"},
    {"key": "abnormal", "label": "异常"},
    {"key": "evidence", "label": "凭证"},
]

ABNORMAL_ACTIONS = {"timeout", "cancel", "reassign", "question"}


@router.get("")
def get_timeline(
    filter: str = Query("all"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    events = (
        db.query(TaskEvent)
        .join(Task, Task.id == TaskEvent.task_id, isouter=True)
        .filter(TaskEvent.family_id == member.family_id)
        .order_by(TaskEvent.created_at.desc(), TaskEvent.id.desc())
        .all()
    )

    def is_evidence(e: TaskEvent) -> bool:
        return bool(
            e.task
            and e.action in ("complete", "confirm")
            and getattr(e.task, "attachments", None)
        )

    all_count = len(events)
    done_count = len([e for e in events if e.action in ("complete", "confirm")])
    abnormal_count = len([e for e in events if e.action in ABNORMAL_ACTIONS or (e.task and e.task.status == "overdue")])
    evidence_count = len([e for e in events if is_evidence(e)])

    if filter == "done":
        events = [e for e in events if e.action in ("complete", "confirm")]
    elif filter == "abnormal":
        events = [e for e in events if e.action in ABNORMAL_ACTIONS or (e.task and e.task.status == "overdue")]
    elif filter == "evidence":
        events = [e for e in events if is_evidence(e)]

    total = len(events)
    start = (page - 1) * pageSize
    page_events = events[start:start + pageSize]

    groups = []
    current_day = None
    for e in page_events:
        day = e.created_at.date()
        if day != current_day:
            current_day = day
            groups.append({"date": iso(day), "dateLabel": human_day(day), "count": 0, "items": []})
        item = event_dict(e)
        if e.task:
            attachments = task_dict(e.task)["attachments"] if e.action in ("complete", "confirm", "attachment") else []
            item["attachments"] = attachments
            item["taskStatus"] = e.task.status
            # 补救动作只给主理子女，前端据此渲染按钮，避免点了才报 403
            can_fix = member.role == "owner" and e.action == "timeout"
            item["canReassign"] = can_fix
            item["canCancel"] = can_fix
        else:
            item["attachments"] = []
            item["canReassign"] = False
            item["canCancel"] = False
        groups[-1]["items"].append(item)
        groups[-1]["count"] += 1

    return ok({
        "filters": [
            {"key": "all", "label": "全部", "count": all_count},
            {"key": "done", "label": "已完成", "count": done_count},
            {"key": "abnormal", "label": "异常", "count": abnormal_count},
            {"key": "evidence", "label": "凭证", "count": evidence_count},
        ],
        "groups": groups,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "hasMore": start + pageSize < total,
        "notice": "只增不改 · 不可删除 · 支持导出 PDF 给医生",
    })
