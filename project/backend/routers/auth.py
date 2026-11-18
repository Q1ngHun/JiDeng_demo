"""登录 / 注册 / 会话（对应 uni-id 的 login、register、checkToken）。"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from common import family_members, primary_elder
from config import APP_VERSION, FAMILY_NAME, VIP_DAYS, VIP_PRICE_CENTS
from db import get_db
from deps import current_family, current_member, current_user
from models import (
    Elder, Family, FamilyMember, Membership, NotificationSetting, User, UserSetting, WidgetSetting,
)
from response import ok
from security import create_token, hash_password, verify_password
from serializers import elder_brief, member_brief, user_brief
from utils import beijing_now, iso, human_day, greeting, today

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=4, max_length=64)


class FaceBody(BaseModel):
    username: Optional[str] = None


class RegisterBody(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=6, max_length=64)
    realName: str = Field(..., min_length=1, max_length=20)
    passwordConfirm: Optional[str] = None


def _session_payload(db: Session, user: User) -> dict:
    member = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == user.id, FamilyMember.status == "active")
        .order_by(FamilyMember.id)
        .first()
    )
    family = db.get(Family, member.family_id) if member else None
    members = family_members(db, family.id) if family else []
    elder = None
    if family:
        elder = db.query(Elder).filter(Elder.family_id == family.id).order_by(Elder.id).first()

    setting = db.query(UserSetting).filter_by(user_id=user.id).first()
    widget = db.query(WidgetSetting).filter_by(user_id=user.id).first()

    return {
        "token": create_token({"uid": user.id, "role": user.role}),
        "user": user_brief(user),
        "family": {
            "id": family.id,
            "name": family.name,
            "inviteCode": family.invite_code,
            "plan": family.plan,
            "memberLimit": family.member_limit,
        } if family else None,
        "member": member_brief(member) if member else None,
        "members": [member_brief(m) for m in members],
        "elder": elder_brief(elder) if elder else None,
        "preferences": {
            "careMode": setting.care_mode if setting else "standard",
            "fontScale": setting.font_scale if setting else 1.0,
            "biometric": setting.biometric_enabled if setting else True,
        },
        "widget": {
            "size": widget.size if widget else "medium",
        },
        "version": APP_VERSION,
    }


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="手机号或密码不正确")
    return ok(_session_payload(db, user))


@router.post("/face")
def face_login(body: FaceBody, db: Session = Depends(get_db)):
    """面容解锁（演示）：真实项目替换为设备生物识别 + 后端一次性凭证。"""
    user = None
    if body.username:
        user = db.query(User).filter(User.username == body.username).first()
    if not user:
        user = db.query(User).filter(User.is_demo == True).first()  # noqa: E712
    if not user:
        raise HTTPException(status_code=404, detail="没有可解锁的账号")
    payload = _session_payload(db, user)
    payload["biometric"] = True
    return ok(payload)


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="该手机号已注册")
    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        nickname=body.realName,
        real_name=body.realName,
        avatar_text=body.realName[:1],
        avatar_color="owner",
        phone=body.username,
        role="owner",
    )
    db.add(user)
    db.flush()

    family = Family(
        name=f"{body.realName[:1]}家",
        owner_id=user.id,
        invite_code=_invite_code(),
        plan="free",
        member_limit=3,
    )
    db.add(family)
    db.flush()
    db.add(FamilyMember(
        family_id=family.id, user_id=user.id, relation="主理子女", role="owner",
    ))
    db.add(NotificationSetting(user_id=user.id))
    db.add(WidgetSetting(user_id=user.id))
    db.add(UserSetting(user_id=user.id))
    db.commit()
    return ok(_session_payload(db, db.get(User, user.id)), "注册成功")


@router.get("/me")
def me(
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    family: Family = Depends(current_family),
    db: Session = Depends(get_db),
):
    setting = db.query(UserSetting).filter_by(user_id=user.id).first()
    elder = db.query(Elder).filter(Elder.family_id == family.id).order_by(Elder.id).first()
    membership = db.query(Membership).filter(Membership.family_id == family.id).order_by(Membership.id.desc()).first()
    data = _session_payload(db, user)
    data.pop("token", None)
    data["elder"] = elder_brief(elder) if elder else None
    data["membership"] = {
        "plan": membership.plan if membership else "free",
        "expiresAt": iso(membership.expires_at) if membership else "",
        "active": bool(membership and membership.expires_at and membership.expires_at > beijing_now()),
    }
    data["greeting"] = greeting()
    data["todayLabel"] = human_day(today())
    data["sync"] = {
        "lastSyncAt": iso(setting.last_sync_at) if setting else iso(beijing_now()),
        "offline": False,
        "cachedTasks": setting.offline_cached_tasks if setting else 34,
    }
    return ok(data)


@router.post("/logout")
def logout():
    return ok(True, "已退出")


def _invite_code() -> str:
    import random
    import string
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
