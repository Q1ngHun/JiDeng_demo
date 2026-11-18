"""
数据库连接（SQLite + SQLAlchemy 2.0 ORM）
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from config import DATABASE_URL


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()


def get_db():
    """FastAPI 依赖：每个请求一个 session。"""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models import (  # noqa: F401  确保模型已注册
        User, Family, FamilyMember, Elder, Task, TaskEvent, Attachment,
        Medication, FollowUp, Report, AccessLog, NotificationSetting, WidgetSetting,
        Membership, PayOrder, ScheduleSlot, ExportRecord, NotificationLog, UserSetting,
    )
    Base.metadata.create_all(bind=engine)
