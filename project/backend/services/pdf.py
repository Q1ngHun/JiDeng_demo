"""导出照护记录 PDF（FR-26 / §5.2）。

- 每个文件带「仅用于就医沟通」水印
- 支持隐藏家人姓名
- 生成后写入 export_records，长辈可在访问记录里看到
"""
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

from config import EXPORT_DIR
from utils import beijing_now

_FONT_NAME = None
_FONT_CANDIDATES = [
    ("C:/Windows/Fonts/msyh.ttc", 0),
    ("C:/Windows/Fonts/msyh.ttf", 0),
    ("C:/Windows/Fonts/simhei.ttf", 0),
    ("C:/Windows/Fonts/simsun.ttc", 0),
    ("/System/Library/Fonts/PingFang.ttc", 0),
    ("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 0),
]


def _font() -> str:
    global _FONT_NAME
    if _FONT_NAME:
        return _FONT_NAME
    for path, index in _FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont("JDFont", path, subfontIndex=index))
                _FONT_NAME = "JDFont"
                return _FONT_NAME
            except Exception:
                continue
    _FONT_NAME = "Helvetica"
    return _FONT_NAME


def _styles():
    font = _font()
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("jdTitle", parent=base["Title"], fontName=font, fontSize=20, leading=28,
                                textColor=colors.HexColor("#171210"), alignment=TA_LEFT, spaceAfter=4),
        "sub": ParagraphStyle("jdSub", parent=base["Normal"], fontName=font, fontSize=9, leading=14,
                              textColor=colors.HexColor("#7A6E63")),
        "h2": ParagraphStyle("jdH2", parent=base["Heading2"], fontName=font, fontSize=12, leading=18,
                             textColor=colors.HexColor("#C2410C"), spaceBefore=10, spaceAfter=6),
        "body": ParagraphStyle("jdBody", parent=base["Normal"], fontName=font, fontSize=9.5, leading=15,
                               textColor=colors.HexColor("#4A4038")),
        "small": ParagraphStyle("jdSmall", parent=base["Normal"], fontName=font, fontSize=8, leading=12,
                                textColor=colors.HexColor("#7A6E63")),
    }


class _NumberedCanvas:
    """给每一页加页脚与水印。"""

    def __init__(self, *args, **kwargs):
        self._saved_page_states = []

    def __call__(self, canvas, doc):
        from reportlab.pdfgen import canvas as _c  # noqa: F401
        canvas.saveState()
        width, height = A4
        canvas.setFont(_font(), 42)
        canvas.setFillColorRGB(0.76, 0.74, 0.71, alpha=0.18)
        canvas.translate(width / 2, height / 2)
        canvas.rotate(32)
        canvas.drawCentredString(0, 0, "仅用于就医沟通")
        canvas.restoreState()

        canvas.saveState()
        canvas.setFont(_font(), 8)
        canvas.setFillColor(colors.HexColor("#A99D91"))
        canvas.drawString(20 * mm, 12 * mm, "家灯 JiaDeng · 照护记录")
        canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f"第 {doc.page} 页")
        canvas.restoreState()


def build_pdf(
    family_name: str,
    events: List[dict],
    scope_label: str,
    user_name: str,
    options: Optional[dict] = None,
    summary: Optional[dict] = None,
) -> Path:
    options = options or {}
    hide_names = bool(options.get("hideNames"))
    include_evidence = options.get("evidence", True)
    include_profile = options.get("profile", True)

    name_map = {}
    for e in events:
        actor = e.get("actorName") or ""
        if actor and actor not in name_map:
            name_map[actor] = f"家属{chr(ord('A') + len(name_map))}"

    def mask(name: str) -> str:
        if not hide_names:
            return name
        return name_map.get(name, name)

    styles = _styles()
    stamp = beijing_now()
    file_name = f"jiadeng-{stamp.strftime('%Y%m%d-%H%M%S')}.pdf"
    path = EXPORT_DIR / file_name

    doc = SimpleDocTemplate(
        str(path), pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=20 * mm,
        title=f"{family_name} · 照护记录", author="家灯 JiaDeng",
    )

    story = []
    story.append(Paragraph(f"{family_name} · 照护记录", styles["title"]))
    story.append(Paragraph(
        f"范围：{scope_label} &nbsp;·&nbsp; 共 {len(events)} 条事件 &nbsp;·&nbsp; "
        f"含凭证 {sum(len(e.get('attachments') or []) for e in events)} 份", styles["sub"]))
    story.append(Paragraph(
        f"导出人：{mask(user_name)} &nbsp;·&nbsp; 生成时间：{stamp.strftime('%Y-%m-%d %H:%M')}", styles["sub"]))
    story.append(Spacer(1, 8))

    notice = Table(
        [[Paragraph(
            "本文件由家灯 App 生成，带「仅用于就医沟通」水印。导出行为已写入照护流水，"
            "长辈可在「谁看过我的档案」中看到这次导出。", styles["small"])]],
        colWidths=[doc.width],
    )
    notice.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFDF7")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#F0E3C8")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(notice)

    if summary:
        story.append(Paragraph("本期概览", styles["h2"]))
        rows = [
            ["完成率", f"{summary.get('completionRate', 0)}%"],
            ["已完成", f"{summary.get('doneCount', 0)} 条"],
            ["超时 / 异常", f"{summary.get('overdueCount', 0)} 条"],
            ["凭证", f"{summary.get('evidenceCount', 0)} 份"],
        ]
        table = Table([[Paragraph(k, styles["body"]), Paragraph(v, styles["body"])] for k, v in rows],
                      colWidths=[doc.width * 0.3, doc.width * 0.7])
        table.setStyle(TableStyle([
            ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#F2EBE2")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(table)

    if include_profile and options.get("profileSummary"):
        story.append(Paragraph("长辈档案摘要", styles["h2"]))
        story.append(Paragraph(options["profileSummary"], styles["body"]))

    story.append(Paragraph("照护时间轴", styles["h2"]))
    header = ["日期", "时间", "事项", "责任人", "状态"]
    data = [[Paragraph(h, styles["small"]) for h in header]]
    for e in sorted(events, key=lambda x: (x.get("date") or "", x.get("time") or "")):
        data.append([
            Paragraph(e.get("dateLabel") or e.get("date") or "", styles["body"]),
            Paragraph(e.get("time") or "", styles["body"]),
            Paragraph(e.get("title") or "", styles["body"]),
            Paragraph(mask(e.get("actorName") or "—"), styles["body"]),
            Paragraph(e.get("statusLabel") or e.get("actionLabel") or "—", styles["body"]),
        ])
    table = Table(data, colWidths=[doc.width * 0.22, doc.width * 0.1, doc.width * 0.42, doc.width * 0.14,
                                   doc.width * 0.12], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F6EFE6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#574C42")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E7DED4")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)

    if include_evidence:
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            "凭证说明：照片与语音凭证保存在家灯 App 内，本 PDF 仅列出凭证数量。", styles["small"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "本记录只反映家灯内的任务与打卡情况，不是医疗文书，也不能替代医生的诊断与建议。",
        styles["small"]))

    doc.build(story, onFirstPage=_NumberedCanvas(), onLaterPages=_NumberedCanvas())
    return path
