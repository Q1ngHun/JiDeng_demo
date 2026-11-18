"""演示数据：与 jiadeng-design 15 屏一一对应，日期相对「今天」生成，任何时候打开都像真的在用。

账号：13800000001 / 123456（王芳 · 主理子女）
      13800000002 / 123456（王丽 · 妹妹）
      13800000003 / 123456（王建国 · 爸爸 · 长辈）
"""
from datetime import date, datetime, time, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

from config import FAMILY_NAME, STATIC_DIR, VIP_PRICE_CENTS, UPLOAD_DIR
from models import (
    AccessLog, Attachment, Elder, ExportRecord, Family, FamilyMember, FollowUp, Medication,
    Membership, NotificationLog, NotificationSetting, PayOrder, Report, ScheduleSlot, Task, TaskEvent,
    User, UserSetting, WidgetSetting,
)
from security import hash_password
from services import report_ai
from utils import beijing_now, today

PASSWORD = "123456"


def dt(day_offset: int, hhmm: str) -> datetime:
    h, m = [int(x) for x in hhmm.split(":")]
    return datetime.combine(today() + timedelta(days=day_offset), time(hour=h, minute=m))


def seed(db: Session, force: bool = False) -> bool:
    if db.query(User).count() > 0 and not force:
        return False

    if force:
        for model in (NotificationLog, TaskEvent, Attachment, PayOrder, Task, Medication, FollowUp,
                      Report, AccessLog, ScheduleSlot, ExportRecord, Membership, NotificationSetting,
                      WidgetSetting, UserSetting, Elder, FamilyMember, Family, User):
            db.query(model).delete()
        db.commit()

    now = beijing_now()
    T = today()

    # ---------- 用户（uni-id-users） ----------
    owner = User(username="13800000001", password_hash=hash_password(PASSWORD), nickname="王芳",
                 real_name="王芳", avatar_text="芳", avatar_color="owner", phone="13800000001",
                 role="owner", is_demo=True, push_clientid="unipush-cid-owner")
    sister = User(username="13800000002", password_hash=hash_password(PASSWORD), nickname="王丽",
                  real_name="王丽", avatar_text="丽", avatar_color="sis", phone="13800000002",
                  role="member", push_clientid="unipush-cid-sister")
    dad = User(username="13800000003", password_hash=hash_password(PASSWORD), nickname="王建国",
               real_name="王建国", avatar_text="爸", avatar_color="dad", phone="13800000003",
               role="elder")
    mom = User(username="13800000004", password_hash=hash_password(PASSWORD), nickname="李秀兰",
               real_name="李秀兰", avatar_text="妈", avatar_color="mom", phone="13800000004",
               role="member", push_clientid="unipush-cid-mom")
    db.add_all([owner, sister, dad, mom])
    db.flush()

    # ---------- 家庭组 ----------
    family = Family(name=FAMILY_NAME, owner_id=owner.id, invite_code="JIADENG", plan="vip",
                    member_limit=8, created_at=now - timedelta(days=11))
    db.add(family)
    db.flush()

    db.add_all([
        FamilyMember(family_id=family.id, user_id=owner.id, relation="主理子女", role="owner",
                     can_view_meds=True, can_view_history=True, can_view_reports=True,
                     joined_at=now - timedelta(days=11)),
        FamilyMember(family_id=family.id, user_id=sister.id, relation="妹妹", role="member",
                     can_view_meds=True, can_view_history=False, can_view_reports=True,
                     joined_at=now - timedelta(days=9)),
        FamilyMember(family_id=family.id, user_id=dad.id, relation="爸爸", role="elder",
                     can_view_meds=True, can_view_history=True, can_view_reports=False,
                     joined_at=now - timedelta(days=11)),
        FamilyMember(family_id=family.id, user_id=mom.id, relation="妈妈", role="member",
                     can_view_meds=True, can_view_history=False, can_view_reports=True,
                     joined_at=now - timedelta(days=6)),
    ])

    # ---------- 长辈档案 ----------
    elder = Elder(
        family_id=family.id, user_id=dad.id, name="王建国", relation="爸爸", gender="男",
        birthday="1958-03-12", height="172cm", weight="68kg", blood_type="AB",
        conditions="高血压、轻度脂肪肝", allergies="青霉素", hospital="市一院", doctor="王志远",
        next_checkup_at=T + timedelta(days=6), completeness=80, avatar_color="dad",
    )
    db.add(elder)
    db.flush()

    # ---------- 会员 ----------
    db.add(Membership(
        family_id=family.id, plan="vip", price_cents=VIP_PRICE_CENTS,
        started_at=now - timedelta(days=120), expires_at=now + timedelta(days=365),
        auto_renew=False, refundable_until=now - timedelta(days=113), status="active",
    ))

    # ---------- 设置 ----------
    db.add(NotificationSetting(user_id=owner.id, push=True, wechat=True, sms=True,
                               notify_done=True, notify_overdue=True, notify_weekly=False,
                               quiet_enabled=True, quiet_start="22:00", quiet_end="08:00",
                               urgent_pass=True))
    db.add(NotificationSetting(user_id=sister.id))
    db.add(WidgetSetting(user_id=owner.id, size="medium", show_tasks=True, show_claim_count=True,
                         show_next_checkup=True, show_health=False, live_activity=True))
    db.add(UserSetting(user_id=owner.id, care_mode="standard", font_scale=1.0,
                       last_sync_at=dt(0, "08:12"), offline_cached_tasks=34))
    db.add(UserSetting(user_id=dad.id, care_mode="elder", font_scale=1.2,
                       last_sync_at=dt(0, "08:05"), offline_cached_tasks=8))

    # ---------- 任务与流水 ----------
    def make_task(title, category, day_off, hhmm, assignee, status, *, creator=owner,
                  repeat="none", need_confirm=True, location="", remind="提前 1 天 20:00",
                  urgent=False, due_off=None, due_time=None, description="", source="manual",
                  created_off=None, created_time="09:00"):
        sched = dt(day_off, hhmm)
        if due_off is None and due_time is None:
            due = datetime.combine(sched.date(), time(23, 59))
        else:
            due = dt(due_off if due_off is not None else day_off, due_time or hhmm)
        task = Task(
            family_id=family.id, elder_id=elder.id, title=title, category=category,
            description=description, creator_id=creator.id, assignee_id=assignee.id if assignee else None,
            scheduled_at=sched, due_at=due, is_urgent=urgent, repeat_rule=repeat,
            location=location, remind_label=remind, need_confirm=need_confirm, status=status,
            source=source,
            created_at=dt(created_off if created_off is not None else day_off - 2, created_time),
        )
        if assignee:
            task.claimed_at = task.created_at + timedelta(hours=5)
        db.add(task)
        db.flush()
        return task

    def ev(task, actor, action, note, when, from_status="", to_status=""):
        db.add(TaskEvent(
            family_id=family.id, task_id=task.id, actor_id=actor.id if actor else None,
            actor_name=(actor.real_name or actor.nickname) if actor else "系统",
            action=action, note=note, from_status=from_status, to_status=to_status, created_at=when,
        ))

    # —— 今天：复查（进行中）——
    recheck = make_task("陪爸爸去市一院心内科复查", "复查", 0, "09:00", sister, "in_progress",
                        location="市一院 3 号楼", description="带化验单、医保单",
                        created_off=-2, created_time="20:00", remind="提前 1 天 20:00")
    recheck.started_at = dt(0, "09:12")
    ev(recheck, owner, "create", "创建任务", dt(-2, "20:00"), "", "pending_claim")
    ev(recheck, sister, "claim", "备注：我周三请半天假", dt(-1, "20:14"), "pending_claim", "claimed")
    ev(recheck, sister, "start", "已到院，开始陪检", dt(0, "09:12"), "claimed", "in_progress")
    db.add(Attachment(task_id=recheck.id, kind="image", url="/static/evidence-1.svg", uploaded_by=sister.id,
                       created_at=dt(0, "09:20")))
    db.add(Attachment(task_id=recheck.id, kind="image", url="/static/evidence-2.svg", uploaded_by=sister.id,
                       created_at=dt(0, "09:34")))

    # —— 今天：取药（待认领）——
    pickup = make_task("去社区医院取降压药", "取药", 0, "18:00", None, "pending_claim",
                       location="社区医院", remind="提前 2 小时", created_off=-1, created_time="18:00")
    ev(pickup, owner, "create", "创建任务", dt(-1, "18:00"), "", "pending_claim")
    ev(pickup, owner, "remind", "已提醒 2 人 · 无人接", dt(0, "08:20"), "pending_claim", "pending_claim")

    # —— 今天：量血压（已认领，每天重复）——
    bp = make_task("量血压并记录", "测量", 0, "19:00", dad, "claimed", repeat="daily",
                   location="家里", need_confirm=False, created_off=-10, created_time="08:00")
    ev(bp, owner, "create", "创建任务（每天重复）", dt(-10, "08:00"), "", "claimed")

    # —— 今天：吃药打卡（已完成）——
    med_task = make_task("吃降压药 1 片", "用药", 0, "08:00", dad, "done", repeat="daily",
                         need_confirm=False, created_off=-10, created_time="08:00")
    ev(med_task, owner, "create", "创建任务（每天重复）", dt(-10, "08:00"), "", "claimed")
    ev(med_task, dad, "complete", "一键确认 · 无凭证（长辈端豁免）", dt(0, "08:05"), "claimed", "done")

    # —— 今天：交水电费（已完成，每月 20 号）——
    bill_done = make_task("交水电费（上月）", "缴费", -1, "10:00", owner, "done", repeat="monthly",
                          created_off=-6, created_time="09:00")
    ev(bill_done, owner, "create", "创建任务（每月 20 号）", dt(-6, "09:00"), "", "claimed")
    ev(bill_done, owner, "complete", "已缴费，凭证 1 张", dt(-1, "10:26"), "claimed", "done")
    db.add(Attachment(task_id=bill_done.id, kind="image", url="/static/evidence-3.svg", uploaded_by=owner.id,
                       created_at=dt(-1, "10:26")))

    # —— 本周：周四体检 / 周五缴费 / 周六散步 / 周日药盒分装 ——
    checkup = make_task("带妈妈去社区体检", "复查", 1, "10:00", sister, "claimed",
                        location="社区卫生服务中心", created_off=-2, created_time="21:10")
    ev(checkup, owner, "create", "创建任务", dt(-2, "21:10"), "", "pending_claim")
    ev(checkup, sister, "claim", "我调了班，可以去", dt(-1, "09:30"), "pending_claim", "claimed")

    bill = make_task("交水电费（每月 20 号）", "缴费", 2, "10:00", owner, "claimed", repeat="monthly",
                     created_off=-20, created_time="09:00")
    ev(bill, owner, "create", "创建任务（每月 20 号）", dt(-20, "09:00"), "", "claimed")

    walk = make_task("陪爸爸散步 30 分钟", "其他", 3, "15:00", owner, "claimed",
                     created_off=-3, created_time="19:00", location="小区花园")
    ev(walk, owner, "create", "创建任务", dt(-3, "19:00"), "", "claimed")

    pillbox = make_task("本周药盒分装", "用药", 4, "09:00", None, "pending_claim",
                        created_off=-1, created_time="21:30", need_confirm=False,
                        description="分 7 天，早/晚两层")

    # —— 历史（周报用）——
    history = [
        (-2, "08:00", "吃降压药 1 片", "用药", dad, "done"),
        (-2, "19:00", "量血压并记录", "测量", dad, "done"),
        (-2, "10:00", "买菜做饭", "其他", owner, "done"),
        (-2, "15:00", "交电话费", "缴费", owner, "done"),
        (-1, "08:00", "吃降压药 1 片", "用药", dad, "done"),
        (-1, "11:42", "量血压并记录", "测量", sister, "done"),
        (-1, "16:00", "取快递", "其他", mom, "done"),
        (-1, "18:30", "陪爸爸散步 30 分钟", "其他", owner, "done"),
    ]
    for off, hhmm, title, cat, who, status in history:
        t = make_task(title, cat, off, hhmm, who, status, need_confirm=False,
                      created_off=off - 2, created_time="08:00")
        ev(t, who if who else owner, "claim", "认领任务", dt(off - 1, "20:00"), "pending_claim", "claimed")
        ev(t, who if who else owner, "complete", "已完成", dt(off, hhmm), "claimed", "done")
        if title == "量血压并记录" and off == -1:
            t.status = "done"
            db.add(Attachment(task_id=t.id, kind="image", url="/static/evidence-2.svg", uploaded_by=sister.id,
                               created_at=dt(off, hhmm)))
            db.add(Attachment(task_id=t.id, kind="image", url="/static/evidence-1.svg", uploaded_by=sister.id,
                               created_at=dt(off, hhmm)))

    # —— 历史：超时的交水电费（异常兜底）——
    overdue_task = make_task("交水电费", "缴费", -5, "10:00", None, "overdue",
                             created_off=-6, created_time="09:30")
    overdue_task.timeout_at = dt(-5, "20:10")
    ev(overdue_task, owner, "create", "创建任务 · 待认领", dt(-6, "09:30"), "", "pending_claim")
    ev(overdue_task, None, "timeout", "超时 26 小时 · 无人认领", dt(-5, "20:10"), "pending_claim", "overdue")

    # —— 历史：有疑问的任务 ——
    q_task = make_task("预约下次心内科号", "复查", -3, "09:00", sister, "question",
                       created_off=-5, created_time="10:00")
    ev(q_task, sister, "question", "这个号要挂专家号还是普通号？", dt(-3, "10:12"), "claimed", "question")

    # ---------- 用药清单 ----------
    db.add_all([
        Medication(elder_id=elder.id, name="苯磺酸氨氯地平", dosage="5mg", frequency="每日 1 次",
                   timing="早饭后", start_date=T - timedelta(days=13), total_days=30,
                   remaining_days=12, remaining_qty=12),
        Medication(elder_id=elder.id, name="阿托伐他汀", dosage="20mg", frequency="每晚 1 次",
                   timing="睡前", start_date=T - timedelta(days=22), total_days=32,
                   remaining_days=24, remaining_qty=48),
        Medication(elder_id=elder.id, name="碳酸钙 D3", dosage="1 片", frequency="每日 1 次",
                   timing="午饭后", start_date=T - timedelta(days=45), end_date=T - timedelta(days=18),
                   total_days=27, remaining_days=0, remaining_qty=0, status="stopped"),
    ])

    db.add(FollowUp(elder_id=elder.id, title="心内科复查", cycle_days=90,
                    last_date=T - timedelta(days=86), next_date=T + timedelta(days=6),
                    need_confirm=True))

    # ---------- 报告 ----------
    abnormal = report_ai.analyze("血常规 + 生化 12 项")
    normal = report_ai.analyze("尿常规")
    db.add(Report(
        elder_id=elder.id, title=abnormal["title"], taken_at=T - timedelta(days=8),
        image_url="/static/report-sample.svg", abnormal_count=abnormal["abnormal_count"],
        confidence=abnormal["confidence"], indicators=abnormal["indicators"],
        summary_abnormal=abnormal["summary_abnormal"], summary_meaning=abnormal["summary_meaning"],
        summary_advice=abnormal["summary_advice"], questions=abnormal["questions"],
        status="pending_ask", disclaimer=abnormal["disclaimer"],
        created_at=dt(-8, "16:20"),
    ))
    db.add(Report(
        elder_id=elder.id, title=normal["title"], taken_at=T - timedelta(days=47),
        image_url="/static/report-sample.svg", abnormal_count=0, confidence=normal["confidence"],
        indicators=normal["indicators"], summary_abnormal=normal["summary_abnormal"],
        summary_meaning=normal["summary_meaning"], summary_advice=normal["summary_advice"],
        questions=normal["questions"], status="archived", disclaimer=normal["disclaimer"],
        created_at=dt(-47, "10:10"),
    ))

    # ---------- 档案访问记录 ----------
    db.add_all([
        AccessLog(elder_id=elder.id, viewer_id=sister.id, viewer_name="王丽", viewer_tag="已授权",
                  scope="查看用药清单", action="view", created_at=dt(-2, "14:20")),
        AccessLog(elder_id=elder.id, viewer_id=dad.id, viewer_name="王建国", viewer_tag="本人",
                  scope="查看全部", action="view", created_at=dt(-8, "09:02")),
        AccessLog(elder_id=elder.id, viewer_id=mom.id, viewer_name="李秀兰", viewer_tag="已授权",
                  scope="查看化验单", action="view", created_at=dt(-8, "19:40")),
    ])

    # ---------- 本周排班（周一为起始） ----------
    week_start_date = T - timedelta(days=T.weekday())
    plan = {
        owner.id: [0, 2, 4],
        sister.id: [1, 2, 5],
        dad.id: [0, 1, 2, 3, 4, 5, 6],
        mom.id: [3, 6],
    }
    labels = {owner.id: "缴费", sister.id: "复查", dad.id: "吃药打卡", mom.id: "买菜"}
    for member_id, offsets in plan.items():
        for off in offsets:
            db.add(ScheduleSlot(
                family_id=family.id, member_id=member_id,
                day=week_start_date + timedelta(days=off), has_duty=True,
                label=labels[member_id],
            ))

    # ---------- 通知日志（演示降级链路） ----------
    db.add_all([
        NotificationLog(user_id=owner.id, task_id=recheck.id, channel="push",
                        title="王丽 完成了任务", body="陪爸爸去市一院心内科复查", status="sent",
                        created_at=dt(0, "09:15")),
        NotificationLog(user_id=sister.id, task_id=pickup.id, channel="wechat",
                        title="这件事还在等你", body="去社区医院取降压药", status="sent",
                        degrade_reason="App 推送未送达，降级到微信服务通知",
                        created_at=dt(-1, "18:05")),
        NotificationLog(user_id=owner.id, task_id=overdue_task.id, channel="push",
                        title="「交水电费」已超时", body="超时 26 小时 · 无人认领", status="sent",
                        created_at=dt(-5, "20:10")),
    ])

    _write_static_assets()
    db.commit()
    return True


def _write_static_assets():
    """生成占位图（凭证 / 化验单），避免演示时出现空白方块。"""
    assets = {
        "evidence-1.svg": ("#FFF1E6", "#FBD5B8", "化验单", "血常规 · 11/18"),
        "evidence-2.svg": ("#E8EEF8", "#C9D6EC", "血压记录", "138 / 86 mmHg"),
        "evidence-3.svg": ("#EAF5EE", "#CDE9DB", "缴费凭证", "已缴费 · 10/17"),
        "report-sample.svg": ("#F6EFE6", "#E7DED4", "化验报告单", "检验科"),
    }
    for name, (bg, line, title, sub) in assets.items():
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="{bg}"/><stop offset="1" stop-color="{line}"/></linearGradient></defs>
<rect width="480" height="480" fill="url(#g)"/>
<rect x="60" y="70" width="360" height="340" rx="18" fill="#ffffff" opacity="0.82"/>
<rect x="92" y="112" width="200" height="14" rx="7" fill="#C9BEB2"/>
<rect x="92" y="142" width="296" height="8" rx="4" fill="#DCD2C6"/>
<rect x="92" y="162" width="240" height="8" rx="4" fill="#DCD2C6"/>
<rect x="92" y="200" width="296" height="1" fill="#E7DED4"/>
<text x="240" y="270" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="34" font-weight="700" fill="#574C42" text-anchor="middle">{title}</text>
<text x="240" y="312" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="22" fill="#7A6E63" text-anchor="middle">{sub}</text>
<rect x="92" y="350" width="160" height="8" rx="4" fill="#DCD2C6"/>
<rect x="92" y="372" width="220" height="8" rx="4" fill="#E7DED4"/>
</svg>"""
        (STATIC_DIR / name).write_text(svg, encoding="utf-8")
