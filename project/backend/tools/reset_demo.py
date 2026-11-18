"""重置演示数据：python tools/reset_demo.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db import SessionLocal, init_db  # noqa: E402
from seed import seed  # noqa: E402


def main():
    init_db()
    db = SessionLocal()
    try:
        seed(db, force=True)
        print("演示数据已重置：13800000001 / 123456")
    finally:
        db.close()


if __name__ == "__main__":
    main()
