"""通知渠道、静默时段、桌面小组件、关怀版（FR-21 ~ FR-23 / R7 / 15）。"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import APP_VERSION
from db import get_db
from deps import current_family, current_member, current_user
from models import (
    Family, FamilyMember, Membership, NotificationLog, NotificationSetting, User, UserSetting, WidgetSetting,
)
from response import ok
from services import notify as notify_service
from utils import beijing_now, iso

router = APIRouter(prefix="/api/settings", tags=["settings"])

CHANNELS = [
    {"key": "push", "label": "App 推送", "hint": "uni-push · 最快"},
    {"key": "wechat", "label": "微信服务通知", "hint": "需用户在微信内主动订阅"},
    {"key": "sms", "label": "短信", "hint": "会员权益 · 仅在推送失败时"},
]

EVENTS = [
    {"key": "notify_done", "label": "有人完成任务"},
    {"key": "notify_overdue", "label": "任务超时未完成"},
    {"key": "notify_weekly", "label": "家庭周报（周日晚）"},
]


class NotifyPatch(BaseModel):
    push: Optional[bool] = None
    wechat: Optional[bool] = None
    sms: Optional[bool] = None
    notify_done: Optional[bool] = None
    notify_overdue: Optional[bool] = None
    notify_weekly: Optional[bool] = None
    quiet_enabled: Optional[bool] = None
    quiet_start: Optional[str] = None
    quiet_end: Optional[str] = None
    urgent_pass: Optional[bool] = None


class WidgetPatch(BaseModel):
    size: Optional[str] = None
    show_tasks: Optional[bool] = None
    show_claim_count: Optional[bool] = None
    show_next_checkup: Optional[bool] = None
    show_health: Optional[bool] = None
    live_activity: Optional[bool] = None


class PrefPatch(BaseModel):
    careMode: Optional[str] = None
    fontScale: Optional[float] = None
    biometric: Optional[bool] = None


def _get_or_create(db: Session, model, user_id: int):
    row = db.query(model).filter_by(user_id=user_id).first()
    if not row:
        row = model(user_id=user_id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _widget_dict(w: WidgetSetting) -> dict:
    return {
        "size": w.size,
        "showTasks": w.show_tasks,
        "showClaimCount": w.show_claim_count,
        "showNextCheckup": w.show_next_checkup,
        "showHealth": w.show_health,
        "liveActivity": w.live_activity,
    }


@router.get("")
def get_settings(
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    ns = _get_or_create(db, NotificationSetting, user.id)
    w = _get_or_create(db, WidgetSetting, user.id)
    us = _get_or_create(db, UserSetting, user.id)
    membership = (
        db.query(Membership).filter(Membership.family_id == family.id).order_by(Membership.id.desc()).first()
    )
    is_vip = bool(membership and membership.expires_at and membership.expires_at > beijing_now())
    return ok({
        "user": {
            "name": user.real_name or user.nickname,
            "avatarText": user.avatar_text,
            "avatarColor": user.avatar_color,
            "relation": member.relation,
            "phone": user.phone,
        },
        "family": {"id": family.id, "name": family.name, "inviteCode": family.invite_code},
        "membership": {
            "plan": "vip" if is_vip else "free",
            "label": f"会员至 {membership.expires_at.strftime('%Y.%m')}" if is_vip else "免费版",
            "expiresAt": iso(membership.expires_at) if membership else "",
        },
        "channels": [
            {**c, "on": bool(getattr(ns, c["key"]))} for c in CHANNELS
        ],
        "events": [
            {**e, "on": bool(getattr(ns, e["key"]))} for e in EVENTS
        ],
        "quiet": {
            "enabled": ns.quiet_enabled,
            "start": ns.quiet_start,
            "end": ns.quiet_end,
            "urgentPass": ns.urgent_pass,
            "label": f"{ns.quiet_start} – {ns.quiet_end}",
        },
        "widget": _widget_dict(w),
        "preferences": {
            "careMode": us.care_mode,
            "fontScale": us.font_scale,
            "biometric": us.biometric_enabled,
        },
        "system": {
            "cache": {"tasks": us.offline_cached_tasks, "sizeLabel": "12.4 MB"},
            "version": APP_VERSION,
            "pushClientId": user.push_clientid or "",
            "lastSyncAt": iso(us.last_sync_at),
        },
        "degradeChain": "降级顺序：App 推送 → 微信服务通知 → 短信。任一条成功即停止，不会重复打扰。",
        "logs": [
            {
                "id": l.id,
                "channel": l.channel,
                "channelLabel": notify_service.CHANNEL_LABEL.get(l.channel, l.channel),
                "title": l.title,
                "body": l.body,
                "status": l.status,
                "degradeReason": l.degrade_reason,
                "timeLabel": l.created_at.strftime("%m/%d %H:%M"),
            }
            for l in notify_service.recent_logs(db, user.id, 6)
        ],
    })


@router.patch("/notifications")
def patch_notifications(
    body: NotifyPatch,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    ns = _get_or_create(db, NotificationSetting, user.id)
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        if value is not None:
            setattr(ns, key, value)
    db.commit()
    db.refresh(ns)
    return ok({
        "channels": [{**c, "on": bool(getattr(ns, c["key"]))} for c in CHANNELS],
        "events": [{**e, "on": bool(getattr(ns, e["key"]))} for e in EVENTS],
        "quiet": {
            "enabled": ns.quiet_enabled, "start": ns.quiet_start, "end": ns.quiet_end,
            "urgentPass": ns.urgent_pass, "label": f"{ns.quiet_start} – {ns.quiet_end}",
        },
    }, "设置已保存")


@router.patch("/widget")
def patch_widget(
    body: WidgetPatch,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    w = _get_or_create(db, WidgetSetting, user.id)
    data = body.model_dump(exclude_unset=True)
    if data.get("size") not in (None, "small", "medium", "large"):
        raise HTTPException(status_code=400, detail="尺寸只支持 small / medium / large")
    for key, value in data.items():
        if value is not None:
            setattr(w, key, value)
    db.commit()
    db.refresh(w)
    return ok(_widget_dict(w), "小组件已更新")


@router.patch("/preferences")
def patch_preferences(
    body: PrefPatch,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    us = _get_or_create(db, UserSetting, user.id)
    data = body.model_dump(exclude_unset=True)
    if data.get("careMode") not in (None, "standard", "elder"):
        raise HTTPException(status_code=400, detail="careMode 只能是 standard / elder")
    for key, value in data.items():
        if value is None:
            continue
        if key == "careMode":
            us.care_mode = value
        elif key == "fontScale":
            us.font_scale = float(value)
        elif key == "biometric":
            us.biometric_enabled = value
    db.commit()
    return ok({"careMode": us.care_mode, "fontScale": us.font_scale, "biometric": us.biometric_enabled}, "已保存")


@router.get("/notification-logs")
def logs(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(NotificationLog)
        .filter(NotificationLog.user_id == user.id)
        .order_by(NotificationLog.id.desc())
        .limit(20)
        .all()
    )
    return ok([{
        "id": l.id, "channel": l.channel,
        "channelLabel": notify_service.CHANNEL_LABEL.get(l.channel, l.channel),
        "title": l.title, "body": l.body, "status": l.status,
        "degradeReason": l.degrade_reason, "timeLabel": l.created_at.strftime("%m/%d %H:%M"),
    } for l in rows])


@router.post("/test-notification")
def test_notification(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """演示降级链路：会真实走一遍「静默 → 推送 → 微信 → 短信」的判断。"""
    setting = db.query(NotificationSetting).filter_by(user_id=user.id).first()
    logs = notify_service.deliver(
        db, user, setting, "这是一条测试提醒",
        "如果你收到了这条消息，说明提醒渠道是通的。", urgent=False,
    )
    return ok([{
        "channel": l.channel,
        "channelLabel": notify_service.CHANNEL_LABEL.get(l.channel, l.channel),
        "status": l.status,
        "degradeReason": l.degrade_reason,
    } for l in logs], "已尝试投递")
