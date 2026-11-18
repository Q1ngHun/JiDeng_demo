"""家灯 JiaDeng · 后端入口

启动：
    python main.py            # http://127.0.0.1:8000
    python main.py --reload   # 开发热重载
    python main.py --reset    # 重置演示数据
"""
import argparse
import os
import sys
import traceback
import webbrowser
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from config import APP_DIR, APP_VERSION, FRONTEND_DIST, HOST, PORT, STATIC_DIR, UPLOAD_DIR
from db import SessionLocal, init_db
from routers import (
    auth, elders, export, home, meds, membership, reports, schedule, settings, tasks, timeline, upload,
)
from seed import seed

DESIGN_DIR = APP_DIR.parent / "jiadeng-design"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        created = seed(db)
        if created:
            print("[家灯] 已写入演示数据（账号 13800000001 / 123456）")
    finally:
        db.close()
    yield


app = FastAPI(
    title="家灯 JiaDeng API",
    version=APP_VERSION,
    description="家庭照护协作 App 后端：任务状态机、照护流水、档案授权、报告解读、会员与导出。",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 字段名 → 中文提示，避免把 Pydantic 的英文报错直接甩给用户
_FIELD_LABELS = {
    "username": "账号",
    "password": "密码",
    "realName": "姓名",
    "title": "任务标题",
    "date": "日期",
    "time": "时间",
    "assigneeId": "责任人",
    "memberId": "成员",
    "elderId": "长辈",
    "scope": "范围",
    "reason": "原因",
    "note": "说明",
    "size": "尺寸",
    "careMode": "关怀版模式",
}

_VALIDATION_TYPES = {
    "missing": "不能为空",
    "string_too_short": "长度不足",
    "string_too_long": "长度超出限制",
    "string_type": "必须是文本",
    "int_parsing": "必须是整数",
    "int_type": "必须是整数",
    "float_parsing": "必须是数字",
    "float_type": "必须是数字",
    "bool_parsing": "必须是布尔值",
    "bool_type": "必须是布尔值",
    "date_parsing": "日期格式应为 YYYY-MM-DD",
    "date_from_datetime_parsing": "日期格式应为 YYYY-MM-DD",
    "json_invalid": "格式不正确",
}


def _format_validation_error(exc: RequestValidationError) -> str:
    messages = []
    for error in exc.errors()[:3]:
        loc = [str(x) for x in error.get("loc", []) if x not in ("body", "query", "path")]
        field = loc[-1] if loc else ""
        label = _FIELD_LABELS.get(field, field)
        text = _VALIDATION_TYPES.get(error.get("type")) or error.get("msg", "参数不合法")
        messages.append(f"{label}{text}" if label else text)
    return "参数有误：" + "；".join(messages) if messages else "参数有误"


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, (dict, list)):
        msg = "请求失败"
        data = detail
    else:
        msg = str(detail)
        data = None
    return JSONResponse(status_code=exc.status_code, content={"code": exc.status_code, "msg": msg, "data": data})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"code": 422, "msg": _format_validation_error(exc), "data": None})


@app.exception_handler(Exception)
async def unknown_error_handler(request: Request, exc: Exception):
    # 详细堆栈只写服务端日志，避免把内部实现暴露给前端
    traceback.print_exception(type(exc), exc, exc.__traceback__, file=sys.stderr)
    return JSONResponse(status_code=500, content={"code": 500, "msg": "服务器开小差了，请稍后重试", "data": None})


for r in (auth, home, tasks, schedule, timeline, elders, meds, reports, settings, membership, export, upload):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"code": 0, "msg": "ok", "data": {"app": "家灯 JiaDeng", "version": APP_VERSION, "status": "running"}}


@app.post("/api/demo/reset")
def demo_reset():
    """一键恢复演示数据（仅本机演示用）。"""
    init_db()
    db = SessionLocal()
    try:
        seed(db, force=True)
    finally:
        db.close()
    return {"code": 0, "msg": "演示数据已重置", "data": None}


app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

if DESIGN_DIR.exists():
    app.mount("/design", StaticFiles(directory=str(DESIGN_DIR), html=True), name="design")

if FRONTEND_DIST.exists():
    assets = FRONTEND_DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="assets")


LANDING = """<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>家灯 JiaDeng · 后端已启动</title>
<style>
body{margin:0;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:#FBF7F2;color:#171210;
display:grid;place-items:center;min-height:100vh}
.card{max-width:560px;background:#fff;border:1px solid #F2EBE2;border-radius:20px;padding:36px 32px;
box-shadow:0 8px 24px rgba(35,22,10,.08)}
h1{font-size:24px;margin:0 0 6px}p{color:#574C42;line-height:1.7;font-size:14px}
code{background:#F6EFE6;padding:2px 6px;border-radius:6px;font-size:13px}
a{color:#C2410C}
.logo{width:56px;height:56px;border-radius:16px;background:linear-gradient(150deg,#F59E0B,#C2410C);
display:grid;place-items:center;color:#fff;font-size:26px;margin-bottom:18px}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.btn{background:#C2410C;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px;font-weight:600}
.btn.ghost{background:#FFF1E6;color:#C2410C;border:1px solid #FBD5B8}
</style></head><body><div class="card">
<div class="logo">灯</div>
<h1>家灯 · 后端已启动</h1>
<p>前端 H5 还没有构建，所以这里只显示后端说明页。执行 <code>start.bat</code> 会自动完成构建，
或手动执行：<br><code>cd frontend &amp;&amp; npm install &amp;&amp; npm run build:h5</code></p>
<div class="row">
<a class="btn" href="/docs">接口文档 /docs</a>
<a class="btn ghost" href="/design/index.html">看设计原型</a>
</div>
</div></body></html>"""


@app.get("/")
def index():
    dist_index = FRONTEND_DIST / "index.html"
    if dist_index.exists():
        return FileResponse(str(dist_index))
    return HTMLResponse(LANDING)


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="接口不存在")
    candidate = (FRONTEND_DIST / full_path).resolve()
    if FRONTEND_DIST.exists() and str(candidate).startswith(str(FRONTEND_DIST.resolve())) and candidate.is_file():
        return FileResponse(str(candidate))
    dist_index = FRONTEND_DIST / "index.html"
    if dist_index.exists():
        return FileResponse(str(dist_index))
    raise HTTPException(status_code=404, detail="页面不存在")


def main():
    parser = argparse.ArgumentParser(description="家灯 JiaDeng 后端")
    parser.add_argument("--host", default=HOST)
    parser.add_argument("--port", type=int, default=PORT)
    parser.add_argument("--reload", action="store_true", help="开发模式热重载")
    parser.add_argument("--reset", action="store_true", help="重置演示数据后启动")
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    try:
        if args.reset:
            seed(db, force=True)
            print("[家灯] 演示数据已重置")
        else:
            seed(db)
    finally:
        db.close()

    url = f"http://{args.host}:{args.port}"
    print(f"\n  家灯 JiaDeng 已启动 → {url}\n  账号：13800000001 / 123456\n")
    if not args.no_browser and os.getenv("JIADENG_NO_BROWSER") != "1":
        try:
            webbrowser.open(url)
        except Exception:
            pass

    import uvicorn
    uvicorn.run("main:app" if args.reload else app, host=args.host, port=args.port,
                reload=args.reload, log_level="info")


if __name__ == "__main__":
    main()
