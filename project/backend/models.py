"""
家灯 JiaDeng · 数据模型
设计要点：
1. 任务状态机固定 7 态（PRD FR-12），所有状态变更必须写 task_events（只增不改）。
2. 照护流水 = task_events 的只读投影，不提供删除接口。
3. 档案访问、导出、通知都会留痕（access_logs / notification_logs / export_records）。
4. 会员与支付按 uni-pay 的下单-回调模型建模，便于替换为真实支付。
"""
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from db import Base


def now() -> datetime:
    from utils import beijing_now
    return beijing_now()


class User(Base):
    """对应 uni-id-users：账号、口令、资料。"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(32), unique=True, nullable=False, index=True)  # 手机号
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(32), nullable=False, default="")
    real_name = Column(String(32), nullable=False, default="")
    avatar_text = Column(String(4), nullable=False, default="我")
    avatar_color = Column(String(16), nullable=False, default="owner")  # owner/sis/dad/mom
    phone = Column(String(20), default="")
    openid = Column(String(64), default="")
    unionid = Column(String(64), default="")
    push_clientid = Column(String(64), default="")  # uni-push cid
    role = Column(String(16), nullable=False, default="member")  # owner/member/elder
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)

    memberships = relationship("FamilyMember", back_populates="user", foreign_keys="FamilyMember.user_id")


class Family(Base):
    __tablename__ = "families"

    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False, default="家")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    invite_code = Column(String(16), unique=True, nullable=False)
    plan = Column(String(16), nullable=False, default="free")  # free / vip
    member_limit = Column(Integer, default=3)
    created_at = Column(DateTime, default=now)


class FamilyMember(Base):
    __tablename__ = "family_members"
    __table_args__ = (UniqueConstraint("family_id", "user_id", name="uq_family_user"),)

    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    relation = Column(String(24), nullable=False, default="成员")  # 主理子女 / 妹妹 / 爸爸
    role = Column(String(16), nullable=False, default="member")  # owner / member / elder
    status = Column(String(16), nullable=False, default="active")  # active / invited
    can_view_meds = Column(Boolean, default=True)
    can_view_history = Column(Boolean, default=False)
    can_view_reports = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=now)

    user = relationship("User", back_populates="memberships", foreign_keys=[user_id])


class Elder(Base):
    """长辈档案（FR-15）。完整度 = 已填字段 / 总字段。"""
    __tablename__ = "elders"

    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(32), nullable=False)
    relation = Column(String(16), default="爸爸")
    gender = Column(String(4), default="男")
    birthday = Column(String(16), default="")
    height = Column(String(16), default="")
    weight = Column(String(16), default="")
    blood_type = Column(String(8), default="")
    conditions = Column(String(255), default="")
    allergies = Column(String(255), default="")
    hospital = Column(String(64), default="")
    doctor = Column(String(32), default="")
    next_checkup_at = Column(Date, nullable=True)
    completeness = Column(Integer, default=0)
    avatar_color = Column(String(16), default="dad")
    created_at = Column(DateTime, default=now)


class Task(Base):
    """任务（FR-09 ~ FR-14）。状态机 7 态。"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False, index=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=True, index=True)
    title = Column(String(120), nullable=False)
    category = Column(String(16), default="其他")  # 复查/取药/测量/缴费/用药/其他
    description = Column(Text, default="")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 空 = 待认领
    scheduled_at = Column(DateTime, nullable=False, index=True)
    due_at = Column(DateTime, nullable=True)
    is_urgent = Column(Boolean, default=False)
    repeat_rule = Column(String(16), default="none")  # none/daily/weekly/monthly
    repeat_until = Column(Date, nullable=True)
    location = Column(String(120), default="")
    remind_label = Column(String(64), default="提前 1 天 20:00")
    need_confirm = Column(Boolean, default=True)
    status = Column(String(24), default="pending_claim", index=True)
    # pending_claim / claimed / in_progress / pending_confirm / done / overdue / question
    source = Column(String(16), default="manual")  # manual/medication/followup/schedule
    claimed_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    timeout_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now, index=True)
    updated_at = Column(DateTime, default=now, onupdate=now)

    assignee = relationship("User", foreign_keys=[assignee_id])
    creator = relationship("User", foreign_keys=[creator_id])
    events = relationship(
        "TaskEvent", back_populates="task", cascade="all, delete-orphan", order_by="TaskEvent.id"
    )
    attachments = relationship(
        "Attachment",
        primaryjoin="Task.id == foreign(Attachment.task_id)",
        viewonly=True,
        order_by="Attachment.id",
    )


class TaskEvent(Base):
    """照护流水 / 任务进度。只增不改（FR-26）。"""
    __tablename__ = "task_events"

    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(32), default="系统")
    action = Column(String(32), nullable=False)  # create/claim/start/complete/confirm/remind/reassign/cancel/export/timeout/question
    from_status = Column(String(24), default="")
    to_status = Column(String(24), default="")
    note = Column(String(255), default="")
    created_at = Column(DateTime, default=now, index=True)

    task = relationship("Task", back_populates="events")


class Attachment(Base):
    """任务凭证（FR-11）：图片 / 语音。"""
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    kind = Column(String(16), default="image")  # image / audio
    url = Column(String(255), nullable=False)
    duration = Column(Integer, default=0)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=now)


class Medication(Base):
    """用药清单（FR-16）。剩余量按打卡推算。"""
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    name = Column(String(64), nullable=False)
    dosage = Column(String(64), default="")
    frequency = Column(String(64), default="每日 1 次")
    timing = Column(String(32), default="早饭后")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    total_days = Column(Integer, default=30)
    remaining_days = Column(Integer, default=30)
    remaining_qty = Column(Integer, default=30)
    status = Column(String(16), default="active")  # active / stopped
    note = Column(String(120), default="")
    created_at = Column(DateTime, default=now)


class FollowUp(Base):
    """复诊周期（FR-17）。生成任务前需要主理确认。"""
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    title = Column(String(64), default="心内科复查")
    cycle_days = Column(Integer, default=90)
    last_date = Column(Date, nullable=True)
    next_date = Column(Date, nullable=True)
    need_confirm = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)


class Report(Base):
    """报告解读（FR-18 ~ FR-20）。三段式固定模板，无自由问答。"""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    title = Column(String(64), nullable=False)
    taken_at = Column(Date, nullable=True)
    image_url = Column(String(255), default="")
    abnormal_count = Column(Integer, default=0)
    confidence = Column(Integer, default=0)
    indicators = Column(JSON, default=list)   # [{name,value,flag}]
    summary_abnormal = Column(Text, default="")
    summary_meaning = Column(Text, default="")
    summary_advice = Column(Text, default="")
    questions = Column(JSON, default=list)    # 建议问医生
    status = Column(String(16), default="archived")  # archived / pending_ask
    disclaimer = Column(Text, default="")
    created_at = Column(DateTime, default=now)


class AccessLog(Base):
    """谁看过这份档案（含导出，PRD §12.3）。"""
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True)
    elder_id = Column(Integer, ForeignKey("elders.id"), nullable=False, index=True)
    viewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    viewer_name = Column(String(32), default="")
    viewer_tag = Column(String(16), default="已授权")  # 本人 / 已授权 / 导出
    scope = Column(String(64), default="查看全部")
    action = Column(String(16), default="view")  # view / export
    created_at = Column(DateTime, default=now, index=True)


class NotificationSetting(Base):
    """通知渠道与静默（FR-21 ~ FR-23）。"""
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    push = Column(Boolean, default=True)
    wechat = Column(Boolean, default=True)
    sms = Column(Boolean, default=True)
    notify_done = Column(Boolean, default=True)
    notify_overdue = Column(Boolean, default=True)
    notify_weekly = Column(Boolean, default=False)  # 默认关闭，避免被当成监控
    quiet_enabled = Column(Boolean, default=True)
    quiet_start = Column(String(8), default="22:00")
    quiet_end = Column(String(8), default="08:00")
    urgent_pass = Column(Boolean, default=True)


class WidgetSetting(Base):
    """桌面小组件（健康数据默认关闭）。"""
    __tablename__ = "widget_settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    size = Column(String(8), default="medium")  # small/medium/large
    show_tasks = Column(Boolean, default=True)
    show_claim_count = Column(Boolean, default=True)
    show_next_checkup = Column(Boolean, default=True)
    show_health = Column(Boolean, default=False)
    live_activity = Column(Boolean, default=True)


class UserSetting(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    care_mode = Column(String(16), default="standard")  # standard / elder
    font_scale = Column(Float, default=1.0)
    last_sync_at = Column(DateTime, default=now)
    offline_cached_tasks = Column(Integer, default=0)
    biometric_enabled = Column(Boolean, default=True)


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False, index=True)
    plan = Column(String(16), default="vip")
    price_cents = Column(Integer, default=9900)
    started_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    auto_renew = Column(Boolean, default=False)
    refundable_until = Column(DateTime, nullable=True)
    status = Column(String(16), default="active")  # active / expired / refunded


class PayOrder(Base):
    """对应 uni-pay 订单：下单 → 支付回调 → 发放权益。"""
    __tablename__ = "pay_orders"

    id = Column(Integer, primary_key=True)
    out_trade_no = Column(String(48), unique=True, nullable=False)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan = Column(String(16), default="vip")
    amount_cents = Column(Integer, default=9900)
    channel = Column(String(16), default="wxpay")
    status = Column(String(16), default="created")  # created / paid / refunded / closed
    transaction_id = Column(String(64), default="")
    created_at = Column(DateTime, default=now)
    paid_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)


class ScheduleSlot(Base):
    """排班表：色块只表示「有人负责」，不含评分。"""
    __tablename__ = "schedule_slots"
    __table_args__ = (UniqueConstraint("family_id", "member_id", "day", name="uq_slot"),)

    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day = Column(Date, nullable=False, index=True)
    has_duty = Column(Boolean, default=False)
    label = Column(String(64), default="")


class ExportRecord(Base):
    """导出留痕：导出也是「看一眼档案」。"""
    __tablename__ = "export_records"

    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scope = Column(String(32), default="本月")
    options = Column(JSON, default=dict)
    event_count = Column(Integer, default=0)
    file_name = Column(String(128), default="")
    created_at = Column(DateTime, default=now, index=True)


class NotificationLog(Base):
    """推送日志（uni-push / 订阅消息 / 短信降级链路）。"""
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    channel = Column(String(16), default="push")  # push / wechat / sms
    title = Column(String(120), default="")
    body = Column(String(255), default="")
    status = Column(String(24), default="sent")  # sent / failed / skipped_quiet
    degrade_reason = Column(String(120), default="")
    created_at = Column(DateTime, default=now, index=True)
