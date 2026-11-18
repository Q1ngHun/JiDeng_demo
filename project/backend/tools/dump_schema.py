"""导出 SQLite 建表语句到 docs/schema.sql：python tools/dump_schema.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.dialects import sqlite  # noqa: E402
from sqlalchemy.schema import CreateIndex, CreateTable  # noqa: E402

from config import APP_DIR  # noqa: E402
from db import Base, engine, init_db  # noqa: E402


def main():
    init_db()
    out = [
        "-- 家灯 JiaDeng · SQLite 数据库结构",
        "-- 由 backend/tools/dump_schema.py 从 SQLAlchemy 模型导出",
        "-- 直接启动后端时也会自动建表，无需手动执行本文件",
        "",
    ]
    for table in Base.metadata.sorted_tables:
        out.append(str(CreateTable(table).compile(dialect=sqlite.dialect())).strip() + ";")
        for index in table.indexes:
            out.append(str(CreateIndex(index).compile(dialect=sqlite.dialect())).strip() + ";")
        out.append("")
    target = APP_DIR / "docs" / "schema.sql"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(out), encoding="utf-8")
    print(f"已导出 {target}")


if __name__ == "__main__":
    main()
