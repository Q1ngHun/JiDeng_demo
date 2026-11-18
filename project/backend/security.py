"""
轻量安全工具：PBKDF2 口令散列 + 纯标准库 HS256 JWT。
不依赖 python-jose / passlib，减少部署时的依赖体积。
"""
import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, Optional

from config import SECRET_KEY, TOKEN_TTL_HOURS

_ITERATIONS = 120_000


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64d(text: str) -> bytes:
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(_ITERATIONS, salt.hex(), digest.hex())


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iterations, salt_hex, digest_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except Exception:
        return False


def create_token(payload: Dict[str, Any], ttl_hours: int = None) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    body = dict(payload)
    body["exp"] = int(time.time()) + int((ttl_hours or TOKEN_TTL_HOURS) * 3600)
    body.setdefault("iat", int(time.time()))
    segs = [
        _b64e(json.dumps(header, separators=(",", ":")).encode()),
        _b64e(json.dumps(body, separators=(",", ":")).encode()),
    ]
    signing_input = ".".join(segs).encode()
    sig = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    segs.append(_b64e(sig))
    return ".".join(segs)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        h, p, s = token.split(".")
        signing_input = f"{h}.{p}".encode()
        expected = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(_b64e(expected), s):
            return None
        payload = json.loads(_b64d(p))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None
