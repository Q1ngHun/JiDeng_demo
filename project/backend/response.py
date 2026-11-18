"""统一响应封装，与前端 request 拦截器约定一致：{code, msg, data}。"""
from typing import Any


def ok(data: Any = None, msg: str = "ok") -> dict:
    return {"code": 0, "msg": msg, "data": data}


def fail(msg: str = "操作失败", code: int = -1, data: Any = None) -> dict:
    return {"code": code, "msg": msg, "data": data}
