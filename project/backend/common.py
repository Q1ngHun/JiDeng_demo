"""家庭上下文辅助查询。"""
from datetime import date
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Elder, FamilyMember
from utils import today


def family_members(db: Session, family_id: int) -> List[FamilyMember]:
    return (
        db.query(FamilyMember)
        .filter(FamilyMember.family_id == family_id, FamilyMember.status == "active")
        .order_by(FamilyMember.id)
        .all()
    )


def primary_elder(db: Session, family_id: int, elder_id: Optional[int] = None) -> Elder:
    q = db.query(Elder).filter(Elder.family_id == family_id)
    if elder_id:
        q = q.filter(Elder.id == elder_id)
    elder = q.order_by(Elder.id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="还没有长辈档案")
    return elder


def check_elder_access(db: Session, member: FamilyMember, elder_id: int) -> Elder:
    elder = db.get(Elder, elder_id)
    if not elder or elder.family_id != member.family_id:
        raise HTTPException(status_code=404, detail="档案不存在")
    if member.role == "elder" and elder.user_id != member.user_id:
        raise HTTPException(status_code=403, detail="无权查看他人档案")
    return elder
