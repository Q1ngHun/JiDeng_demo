"""报告解读：固定三段式白话模板（FR-19）。

刻意不做自由问答——没有输入框、没有追问接口，避免医疗表述风险。
真实项目里这一段替换为 OCR + 大模型结构化输出，本文件提供同结构的示例数据。
"""
from datetime import date
import random
from typing import Optional

DISCLAIMER = (
    "本内容由 AI 基于图片识别生成，仅用于帮助理解报告单上的常见指标，"
    "不构成医学诊断、治疗或用药建议。具体判断请以医生意见为准。"
)

_TEMPLATE_NORMAL = {
    "abnormal_count": 0,
    "confidence": 96,
    "indicators": [
        {"name": "白细胞", "value": "6.4", "unit": "10^9/L", "ref": "3.5–9.5", "flag": "normal"},
        {"name": "血红蛋白", "value": "136", "unit": "g/L", "ref": "130–175", "flag": "normal"},
        {"name": "血小板", "value": "212", "unit": "10^9/L", "ref": "125–350", "flag": "normal"},
        {"name": "空腹血糖", "value": "5.1", "unit": "mmol/L", "ref": "3.9–6.1", "flag": "normal"},
        {"name": "肌酐", "value": "78", "unit": "μmol/L", "ref": "57–97", "flag": "normal"},
    ],
    "summary_abnormal": "全部指标都在参考范围内",
    "summary_meaning": "这份报告单上的常见指标没有超出参考范围，说明这次检查没有发现明显异常。",
    "summary_advice": "指标正常不等于可以停药。如果长辈正在服药，请按医生原来的方案继续，不要自行调整。",
    "questions": [
        "这次指标正常，下次复查建议隔多久？",
        "现在吃的药还需要继续原来的剂量吗？",
    ],
}

_TEMPLATE_ABNORMAL = {
    "abnormal_count": 3,
    "confidence": 94,
    "indicators": [
        {"name": "白细胞", "value": "11.2", "unit": "10^9/L", "ref": "3.5–9.5", "flag": "high"},
        {"name": "中性粒细胞", "value": "78", "unit": "%", "ref": "40–75", "flag": "high"},
        {"name": "血红蛋白", "value": "118", "unit": "g/L", "ref": "130–175", "flag": "low"},
        {"name": "血小板", "value": "196", "unit": "10^9/L", "ref": "125–350", "flag": "normal"},
        {"name": "空腹血糖", "value": "5.6", "unit": "mmol/L", "ref": "3.9–6.1", "flag": "normal"},
    ],
    "summary_abnormal": "3 项不在参考范围",
    "summary_meaning": (
        "白细胞与中性粒细胞偏高，常见于身体正在抵抗感染；"
        "血红蛋白偏低，常见于营养不足或慢性失血。"
    ),
    "summary_advice": "把报告带给开药的医生看，由医生判断是否需要复查或调整用药。",
    "questions": [
        "这次白细胞偏高，需要复查吗？",
        "血红蛋白偏低要不要补铁？",
        "现在吃的降压药会影响这些指标吗？",
    ],
}


def analyze(title: str, image_url: str = "", seed: Optional[int] = None) -> dict:
    """根据报告名称选择模板，返回可直接入库的三段式结果。"""
    normal = any(k in (title or "") for k in ("尿常规", "正常", "体检"))
    tpl = dict(_TEMPLATE_NORMAL if normal else _TEMPLATE_ABNORMAL)
    tpl["title"] = title or ("尿常规" if normal else "血常规 + 生化 12 项")
    tpl["image_url"] = image_url
    tpl["taken_at"] = date.today()
    tpl["disclaimer"] = DISCLAIMER
    if seed is not None:
        rnd = random.Random(seed)
        tpl["confidence"] = max(88, min(99, tpl["confidence"] + rnd.randint(-3, 3)))
    return tpl
