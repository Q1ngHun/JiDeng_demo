"""
家灯 JiaDeng · 后端配置
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
APP_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
EXPORT_DIR = DATA_DIR / "exports"
STATIC_DIR = BASE_DIR / "static"
FRONTEND_DIST = APP_DIR / "frontend" / "dist" / "build" / "h5"
PREVIEW_DIR = APP_DIR / "preview"

for _d in (DATA_DIR, UPLOAD_DIR, EXPORT_DIR, STATIC_DIR, PREVIEW_DIR):
    _d.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "jiadeng.db"
DATABASE_URL = os.getenv("JIADENG_DB", "sqlite:///" + DB_PATH.as_posix())

SECRET_KEY = os.getenv("JIADENG_SECRET", "jiadeng-local-dev-secret-please-change")
TOKEN_TTL_HOURS = int(os.getenv("JIADENG_TOKEN_TTL", str(24 * 30)))
HOST = os.getenv("JIADENG_HOST", "127.0.0.1")
PORT = int(os.getenv("JIADENG_PORT", "8000"))

TZ_OFFSET_HOURS = 8  # 北京时间
FAMILY_NAME = "李家"

# 会员价格（分）
VIP_PRICE_CENTS = 9900
VIP_DAYS = 365
VIP_REFUND_DAYS = 7

# 免费 / 会员额度
FREE_QUOTA = {"families": 1, "members": 3, "tasks_per_month": 20, "ai_reports": 3, "exports": 0, "sms": 0}
VIP_QUOTA = {"families": 3, "members": 8, "tasks_per_month": -1, "ai_reports": 30, "exports": 30, "sms": -1}

QUIET_START = "22:00"
QUIET_END = "08:00"

# 应用版本
APP_VERSION = "0.1.0"
