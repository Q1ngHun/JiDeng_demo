"""通用工具：时间、状态文案、周区间等。"""
from datetime import date, datetime, time, timedelta

from fastapi import HTTPException

from config import TZ_OFFSET_HOURS

WEEK_LABELS = ["一", "二", "三", "四", "五", "六", "日"]
STATUS_META = {
    "pending_claim": {"label": "待认领", "tone": "wait"},
    "claimed": {"label": "已认领", "tone": "mute"},
    "in_progress": {"label": "进行中", "tone": "doing"},
    "pending_confirm": {"label": "待确认", "tone": "confirm"},
    "done": {"label": "已完成", "tone": "done"},
    "overdue": {"label": "已超时", "tone": "late"},
    "question": {"label": "有疑问", "tone": "wait"},
    "cancelled": {"label": "已取消", "tone": "mute"},
    "skipped": {"label": "已跳过", "tone": "mute"},
}
CATEGORY_META = {
    "复查": "复查", "取药": "取药", "测量": "测量",
    "缴费": "缴费", "用药": "用药", "其他": "其他",
}


def beijing_now() -> datetime:
    """返回不带时区的北京时间，便于 SQLite 存取。"""
    return datetime.utcnow() + timedelta(hours=TZ_OFFSET_HOURS)


def today() -> date:
    return beijing_now().date()


def iso(dt) -> str:
    if not dt:
        return ""
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%dT%H:%M:%S")
    if isinstance(dt, date):
        return dt.strftime("%Y-%m-%d")
    return str(dt)


def parse_dt(value: str) -> datetime:
    value = (value or "").strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise HTTPException(
        status_code=400,
        detail=f"时间格式不正确：{value or '空值'}（应为 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm:ss）",
    )


def parse_date(value: str) -> date:
    return parse_dt(value).date()


def week_start(d: date = None) -> date:
    d = d or today()
    return d - timedelta(days=d.weekday())


def week_range(d: date = None):
    start = week_start(d)
    return start, start + timedelta(days=6)


def human_day(d: date) -> str:
    """11月18日 周三"""
    return f"{d.month}月{d.day}日 周{WEEK_LABELS[d.weekday()]}"


def human_day_short(d: date) -> str:
    return f"{d.month:02d}/{d.day:02d} 周{WEEK_LABELS[d.weekday()]}"


def human_time(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def human_dt(dt: datetime) -> str:
    return f"{dt.month:02d}/{dt.day:02d} {dt.strftime('%H:%M')}"


def relative_day_label(dt: datetime) -> str:
    if not dt:
        return ""
    t = today()
    dd = dt.date()
    if dd == t:
        return "今天 " + dt.strftime("%H:%M")
    if dd == t - timedelta(days=1):
        return "昨天 " + dt.strftime("%H:%M")
    return f"{dt.month}/{dt.day} {dt.strftime('%H:%M')}"


def greeting(dt: datetime = None) -> str:
    dt = dt or beijing_now()
    h = dt.hour
    if h < 6:
        return "夜深了"
    if h < 11:
        return "早上好"
    if h < 13:
        return "中午好"
    if h < 18:
        return "下午好"
    return "晚上好"


def progress_percent(start: datetime, due: datetime, now: datetime = None) -> int:
    """剩余时间百分比（用于倒计时条）。"""
    now = now or beijing_now()
    total = (due - start).total_seconds()
    if total <= 0:
        return 0
    left = (due - now).total_seconds()
    return max(0, min(100, int(left / total * 100)))


def remaining_text(due: datetime, now: datetime = None) -> str:
    now = now or beijing_now()
    delta = (due - now).total_seconds()
    if delta <= 0:
        over = int(-delta // 3600)
        return f"已超时 {max(1, over)} 小时" if over else "已超时"
    hours, minutes = int(delta // 3600), int((delta % 3600) // 60)
    if hours >= 24:
        return f"剩 {hours // 24} 天 {hours % 24} 小时"
    return f"剩 {hours} 小时 {minutes} 分"


def weekday_cn(d: date) -> str:
    return "周" + WEEK_LABELS[d.weekday()]
