"""通知服务：App 推送 → 微信服务通知 → 短信 的降级链路（FR-22 / FR-23）。

本机演示不会真正发短信，而是把每一次投递写入 notification_logs，
让「我的 → 提醒渠道」里能看到链路结果。真实项目里替换 UniPushSender 即可。
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from models import NotificationLog, NotificationSetting, Task, User
from utils import beijing_now

CHANNEL_LABEL = {"push": "App 推送", "wechat": "微信服务通知", "sms": "短信"}


def _in_quiet_hours(setting: NotificationSetting, dt: datetime) -> bool:
    if not setting or not setting.quiet_enabled:
        return False
    try:
        sh, sm = [int(x) for x in (setting.quiet_start or "22:00").split(":")]
        eh, em = [int(x) for x in (setting.quiet_end or "08:00").split(":")]
    except Exception:
        return False
    start = dt.replace(hour=sh, minute=sm, second=0, microsecond=0)
    end = dt.replace(hour=eh, minute=em, second=0, microsecond=0)
    if start <= end:
        return start <= dt <= end
    return dt >= start or dt <= end


def deliver(
    db: Session,
    user: User,
    setting: Optional[NotificationSetting],
    title: str,
    body: str,
    task: Optional[Task] = None,
    urgent: bool = False,
) -> List[NotificationLog]:
    """按降级链路投递一条提醒，成功即停止。"""
    now = beijing_now()
    logs: List[NotificationLog] = []

    setting = setting or db.query(NotificationSetting).filter_by(user_id=user.id).first()

    if setting and _in_quiet_hours(setting, now) and not (urgent and setting.urgent_pass):
        log = NotificationLog(
            user_id=user.id,
            task_id=task.id if task else None,
            channel="push",
            title=title,
            body=body,
            status="skipped_quiet",
            degrade_reason=f"静默时段 {setting.quiet_start}–{setting.quiet_end}，任务非紧急",
        )
        db.add(log)
        db.commit()
        return [log]

    chain = []
    if not setting or setting.push:
        chain.append("push")
    if not setting or setting.wechat:
        chain.append("wechat")
    if not setting or setting.sms:
        chain.append("sms")
    if urgent and "push" in chain:
        chain = ["push"] + [c for c in chain if c != "push"]

    # uni-push 没有 clientid 视作推送不可用，自动降级
    if "push" in chain and not user.push_clientid:
        chain.remove("push")

    if not chain:
        log = NotificationLog(
            user_id=user.id, task_id=task.id if task else None, channel="push",
            title=title, body=body, status="failed", degrade_reason="所有渠道均已关闭",
        )
        db.add(log)
        db.commit()
        return [log]

    for channel in chain:
        log = NotificationLog(
            user_id=user.id,
            task_id=task.id if task else None,
            channel=channel,
            title=title,
            body=body,
            status="sent",
            degrade_reason="" if channel == chain[0] else f"上一级渠道失败，降级到{CHANNEL_LABEL[channel]}",
        )
        db.add(log)
        logs.append(log)
        # 演示环境：App 推送（有 clientid）视为一次命中；否则继续降级
        if channel == "push" and user.push_clientid:
            break
        if channel == "wechat":
            break
    db.commit()
    return logs


def recent_logs(db: Session, user_id: int, limit: int = 10):
    return (
        db.query(NotificationLog)
        .filter(NotificationLog.user_id == user_id)
        .order_by(NotificationLog.id.desc())
        .limit(limit)
        .all()
    )
