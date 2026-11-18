"""家庭会员（FR-24 / FR-25）：uni-pay 下单 → 回调 → 发权益；7 天无理由退款。"""
import random
import string
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import FREE_QUOTA, VIP_DAYS, VIP_PRICE_CENTS, VIP_QUOTA, VIP_REFUND_DAYS
from db import get_db
from deps import current_family, current_member, current_user
from models import Elder, ExportRecord, Family, FamilyMember, Medication, Membership, NotificationSetting, PayOrder, Report, Task, User
from response import ok
from utils import beijing_now, iso

router = APIRouter(prefix="/api/membership", tags=["membership"])

BENEFITS = [
    {"icon": "doc", "label": "记录导出 PDF", "hint": "给医生看时不用翻手机", "tag": "常用"},
    {"icon": "bell", "label": "短信提醒", "hint": "推送失败时的兜底，长辈也能收到"},
    {"icon": "chart", "label": "4 位长辈档案", "hint": "爸妈各一份，不用来回切换账号"},
]

QUOTA_TABLE = [
    {"label": "家庭组数", "free": "1", "vip": "3"},
    {"label": "成员上限", "free": "3", "vip": "8"},
    {"label": "任务数", "free": "20 条/月", "vip": "不限"},
    {"label": "AI 解读", "free": "3 次/月", "vip": "30 次/月"},
    {"label": "导出 PDF", "free": "—", "vip": "✓"},
    {"label": "短信提醒", "free": "—", "vip": "✓"},
]


class OrderBody(BaseModel):
    channel: str = "wxpay"
    plan: str = "vip"


def _membership(db: Session, family_id: int) -> Optional[Membership]:
    return (
        db.query(Membership)
        .filter(Membership.family_id == family_id)
        .order_by(Membership.id.desc())
        .first()
    )


def _is_active(m: Optional[Membership]) -> bool:
    return bool(m and m.expires_at and m.expires_at > beijing_now() and m.status == "active")


def quota(db: Session, family_id: int) -> dict:
    m = _membership(db, family_id)
    vip = _is_active(m)
    now = beijing_now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    tasks_used = (
        db.query(Task).filter(Task.family_id == family_id, Task.created_at >= month_start).count()
    )
    exports_used = (
        db.query(ExportRecord).filter(ExportRecord.family_id == family_id, ExportRecord.created_at >= month_start).count()
    )
    reports_used = (
        db.query(Report).join(Elder, Elder.id == Report.elder_id)
        .filter(Elder.family_id == family_id, Report.created_at >= month_start).count()
    )
    members = db.query(FamilyMember).filter(FamilyMember.family_id == family_id, FamilyMember.status == "active").count()
    elders = db.query(Elder).filter(Elder.family_id == family_id).count()

    plan = VIP_QUOTA if vip else FREE_QUOTA
    return {
        "plan": "vip" if vip else "free",
        "tasks": {"used": tasks_used, "limit": plan["tasks_per_month"]},
        "exports": {"used": exports_used, "limit": plan["exports"], "left": max(0, plan["exports"] - exports_used)},
        "reports": {"used": reports_used, "limit": plan["ai_reports"]},
        "members": {"used": members, "limit": plan["members"]},
        "elders": {"used": elders, "limit": 4 if vip else 1},
        "tasksLeftThisMonth": max(0, plan["tasks_per_month"] - tasks_used) if plan["tasks_per_month"] >= 0 else -1,
    }


@router.get("")
def get_membership(
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    m = _membership(db, family.id)
    active = _is_active(m)
    orders = (
        db.query(PayOrder)
        .filter(PayOrder.family_id == family.id)
        .order_by(PayOrder.id.desc())
        .limit(5)
        .all()
    )
    return ok({
        "plan": "vip" if active else "free",
        "active": active,
        "price": {"cents": VIP_PRICE_CENTS, "label": "99", "unit": "元 / 年", "perMonth": "≈8.3 元/月"},
        "included": "已含：3 个家庭组 · 8 位成员 · 4 位长辈 · 无限任务",
        "benefits": BENEFITS,
        "table": QUOTA_TABLE,
        "policy": "7 天内无理由退款 · 到期不自动续费 · 降级后历史数据只读不删除",
        "membership": {
            "startedAt": iso(m.started_at) if m else "",
            "expiresAt": iso(m.expires_at) if m else "",
            "autoRenew": bool(m.auto_renew) if m else False,
            "refundableUntil": iso(m.refundable_until) if m else "",
            "canRefund": bool(active and m.refundable_until and m.refundable_until > beijing_now()),
            "status": m.status if m else "free",
        },
        "quota": quota(db, family.id),
        "orders": [{
            "outTradeNo": o.out_trade_no,
            "amount": o.amount_cents,
            "status": o.status,
            "channel": o.channel,
            "createdAt": iso(o.created_at),
            "paidAt": iso(o.paid_at),
        } for o in orders],
    })


@router.post("/orders")
def create_order(
    body: OrderBody,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可开通会员")
    if body.channel not in ("wxpay", "alipay"):
        raise HTTPException(status_code=400, detail="只支持微信支付 / 支付宝")
    no = "JD" + beijing_now().strftime("%Y%m%d%H%M%S") + "".join(random.choices(string.digits, k=4))
    order = PayOrder(
        out_trade_no=no,
        family_id=family.id,
        user_id=user.id,
        plan=body.plan,
        amount_cents=VIP_PRICE_CENTS,
        channel=body.channel,
        status="created",
    )
    db.add(order)
    db.commit()
    return ok({
        "outTradeNo": no,
        "amount": VIP_PRICE_CENTS,
        "channel": body.channel,
        "provider": "uni-pay",
        # 真实项目：这里返回 uni-pay 的 orderInfo / payment 参数
        "payParams": {"timeStamp": str(int(beijing_now().timestamp())), "nonceStr": no[-8:], "package": "prepay_id=mock", "signType": "MD5", "paySign": "mock-sign"},
    }, "订单已创建")


@router.post("/orders/{out_trade_no}/pay")
def pay_order(
    out_trade_no: str,
    user: User = Depends(current_user),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    """模拟支付回调：真实项目由 uni-pay 异步通知触发，必须验签 + 幂等。"""
    order = db.query(PayOrder).filter(PayOrder.out_trade_no == out_trade_no).first()
    if not order or order.family_id != family.id:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status == "paid":
        return ok({"outTradeNo": order.out_trade_no, "status": "paid"}, "订单已支付")

    now = beijing_now()
    order.status = "paid"
    order.paid_at = now
    order.transaction_id = "MOCK" + out_trade_no

    m = _membership(db, family.id)
    if _is_active(m):
        m.expires_at = m.expires_at + timedelta(days=VIP_DAYS)
        m.price_cents += VIP_PRICE_CENTS
    else:
        m = Membership(
            family_id=family.id,
            plan="vip",
            price_cents=VIP_PRICE_CENTS,
            started_at=now,
            expires_at=now + timedelta(days=VIP_DAYS),
            auto_renew=False,
            refundable_until=now + timedelta(days=VIP_REFUND_DAYS),
            status="active",
        )
        db.add(m)
    family.plan = "vip"
    family.member_limit = 8

    ns = db.query(NotificationSetting).filter_by(user_id=user.id).first()
    if ns:
        ns.sms = True

    db.commit()
    db.refresh(m)
    return ok({
        "outTradeNo": order.out_trade_no,
        "status": "paid",
        "membership": {"plan": "vip", "expiresAt": iso(m.expires_at)},
        "quota": quota(db, family.id),
    }, "开通成功，7 天内可无理由退款")


@router.post("/refund")
def refund(
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可申请退款")
    m = _membership(db, family.id)
    if not _is_active(m):
        raise HTTPException(status_code=400, detail="当前没有生效中的会员")
    if m.refundable_until and m.refundable_until < beijing_now():
        raise HTTPException(status_code=400, detail="已超过 7 天无理由退款期限")
    m.status = "refunded"
    family.plan = "free"
    family.member_limit = 3
    order = (
        db.query(PayOrder)
        .filter(PayOrder.family_id == family.id, PayOrder.status == "paid")
        .order_by(PayOrder.id.desc())
        .first()
    )
    if order:
        order.status = "refunded"
        order.refunded_at = beijing_now()
    db.commit()
    return ok({"plan": "free", "refunded": True}, "已退款，历史数据保留只读")
