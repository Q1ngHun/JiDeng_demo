"""FastAPI 依赖：登录态与家庭上下文。"""
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from models import Family, FamilyMember, User
from security import decode_token


def _bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return authorization.strip()


def current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    token = _bearer(authorization)
    payload = decode_token(token) if token else None
    if not payload:
        raise HTTPException(status_code=401, detail="登录已失效，请重新解锁")
    user = db.get(User, int(payload.get("uid", 0)))
    if not user:
        raise HTTPException(status_code=401, detail="账号不存在")
    return user


def current_member(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> FamilyMember:
    member = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == user.id, FamilyMember.status == "active")
        .order_by(FamilyMember.id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="尚未加入任何家庭组")
    return member


def current_family(
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
) -> Family:
    family = db.get(Family, member.family_id)
    if not family:
        raise HTTPException(status_code=404, detail="家庭组不存在")
    return family


def require_owner(member: FamilyMember = Depends(current_member)) -> FamilyMember:
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="仅主理子女可执行该操作")
    return member
