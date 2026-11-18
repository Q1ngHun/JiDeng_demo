"""报告解读（FR-18 ~ FR-20）：三段式硬模板 + 置信度 + 固定免责声明。"""
from datetime import datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from common import check_elder_access, primary_elder
from config import FREE_QUOTA, VIP_QUOTA
from db import get_db
from deps import current_member, current_user
from models import AccessLog, Elder, FamilyMember, Membership, Report, User
from response import ok
from serializers import report_dict
from services import report_ai
from utils import beijing_now, iso, today

router = APIRouter(prefix="/api/reports", tags=["reports"])


class AnalyzeBody(BaseModel):
    title: str = "血常规 + 生化 12 项"
    imageUrl: str = ""
    elderId: Optional[int] = None


def _quota(db: Session, family_id: int) -> dict:
    membership = (
        db.query(Membership)
        .filter(Membership.family_id == family_id)
        .order_by(Membership.id.desc())
        .first()
    )
    is_vip = bool(membership and membership.expires_at and membership.expires_at > beijing_now())
    limit = (VIP_QUOTA if is_vip else FREE_QUOTA)["ai_reports"]
    month_start = beijing_now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    used = (
        db.query(Report)
        .join(Elder, Elder.id == Report.elder_id)
        .filter(Elder.family_id == family_id)
        .filter(Report.created_at >= month_start)
        .count()
    )
    return {"plan": "vip" if is_vip else "free", "used": used, "limit": limit, "left": max(0, limit - used)}


@router.get("")
def list_reports(
    elderId: Optional[int] = None,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    elder = primary_elder(db, member.family_id, elderId)
    rows = (
        db.query(Report)
        .filter(Report.elder_id == elder.id)
        .order_by(Report.taken_at.desc(), Report.id.desc())
        .all()
    )
    quota = _quota(db, member.family_id)
    latest = rows[0] if rows else None
    return ok({
        "elder": {"id": elder.id, "name": elder.name},
        "reports": [report_dict(r) for r in rows],
        "latest": report_dict(latest) if latest else None,
        "quota": quota,
        "disclaimer": report_ai.DISCLAIMER,
        "notice": "页面内没有输入框，也不提供追问入口。把问题带去问医生，比在这里问更安全。",
    })


@router.get("/{report_id}")
def get_report(
    report_id: int,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    check_elder_access(db, member, report.elder_id)
    return ok(report_dict(report))


@router.post("/analyze")
def analyze(
    body: AnalyzeBody,
    user: User = Depends(current_user),
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    elder = primary_elder(db, member.family_id, body.elderId)
    quota = _quota(db, member.family_id)
    if quota["limit"] >= 0 and quota["used"] >= quota["limit"]:
        raise HTTPException(status_code=402, detail="本月 AI 解读次数已用完，升级会员可获得 30 次/月")

    result = report_ai.analyze(body.title, body.imageUrl, seed=quota["used"] + 1)
    report = Report(
        elder_id=elder.id,
        title=result["title"],
        taken_at=result["taken_at"],
        image_url=result["image_url"],
        abnormal_count=result["abnormal_count"],
        confidence=result["confidence"],
        indicators=result["indicators"],
        summary_abnormal=result["summary_abnormal"],
        summary_meaning=result["summary_meaning"],
        summary_advice=result["summary_advice"],
        questions=result["questions"],
        status="archived",
        disclaimer=result["disclaimer"],
    )
    db.add(report)
    db.add(AccessLog(
        elder_id=elder.id, viewer_id=user.id, viewer_name=user.real_name or user.nickname,
        viewer_tag="已授权", scope="上传化验单并解读", action="view",
    ))
    db.commit()
    db.refresh(report)
    return ok({"report": report_dict(report), "quota": _quota(db, member.family_id)}, "解读完成，已归档")


@router.post("/{report_id}/ask-list")
def add_to_ask_list(
    report_id: int,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    check_elder_access(db, member, report.elder_id)
    report.status = "pending_ask"
    db.commit()
    db.refresh(report)
    return ok(report_dict(report), "已加入问诊清单")


@router.post("/{report_id}/archive")
def archive(
    report_id: int,
    member: FamilyMember = Depends(current_member),
    db: Session = Depends(get_db),
):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    check_elder_access(db, member, report.elder_id)
    report.status = "archived"
    db.commit()
    return ok(report_dict(report), "已归档")
