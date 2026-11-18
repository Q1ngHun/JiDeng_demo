"""文件上传（凭证 / 化验单）。"""
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from config import UPLOAD_DIR
from db import get_db
from deps import current_user
from models import User
from response import ok
from utils import beijing_now

router = APIRouter(prefix="/api", tags=["upload"])

ALLOWED = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    name = Path(file.filename or "upload.jpg").name
    suffix = Path(name).suffix.lower() or ".jpg"
    if suffix not in ALLOWED:
        suffix = ".jpg"
    stored = f"u{user.id}-{beijing_now().strftime('%Y%m%d%H%M%S')}-{abs(hash(name)) % 10000}{suffix}"
    (UPLOAD_DIR / stored).write_bytes(await file.read())
    return ok({"url": f"/uploads/{stored}"}, "上传成功")
