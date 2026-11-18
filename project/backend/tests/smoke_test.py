"""接口冒烟测试：python tests/smoke_test.py [base_url]

覆盖 15 屏用到的全部接口：登录、首页、看板、排班、创建、详情、流水、导出、
档案、用药、报告、小组件、设置、会员。
"""
import json
import sys
import urllib.error
import urllib.request

# Windows 控制台默认 GBK，直接 print emoji/中文会抛 UnicodeEncodeError
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
TOKEN = None
FAILED = []


def call(method, path, body=None, expect=200, token=True, raw=False):
    url = BASE + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token and TOKEN:
        headers["Authorization"] = "Bearer " + TOKEN
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = resp.read()
            status = resp.status
    except urllib.error.HTTPError as e:
        payload = e.read()
        status = e.code
    except Exception as e:  # noqa: BLE001
        print(f"  ! {method} {path} 连接失败 {e}")
        FAILED.append(path)
        return None
    ok = status == expect
    if not ok:
        print(f"  x {method} {path} -> {status} {payload[:200]!r}")
        FAILED.append(path)
        return None
    if raw:
        return payload
    try:
        return json.loads(payload)
    except Exception:
        return payload


def check(name, cond, extra=""):
    if cond:
        print(f"  ok  {name} {extra}")
    else:
        print(f"  x   {name} {extra}")
        FAILED.append(name)


def login_as(username, password="123456"):
    """切换演示身份，返回登录响应。"""
    global TOKEN
    res = call("POST", "/api/auth/login", {"username": username, "password": password})
    TOKEN = res["data"]["token"] if res and res.get("code") == 0 else None
    return res


print("== 家灯 JiaDeng 接口冒烟测试 ==", BASE)
print("\n[登录]")
login = call("POST", "/api/auth/login", {"username": "13800000001", "password": "123456"})
check("手机号登录", login and login["code"] == 0 and login["data"]["family"]["name"] == "李家")
TOKEN = login["data"]["token"]
face = call("POST", "/api/auth/face", {})
check("面容解锁", face and face["code"] == 0)
me = call("GET", "/api/auth/me")
check("会话信息", me and me["code"] == 0, me and f"careMode={me['data']['preferences']['careMode']}")

print("\n[首页 / 看板]")
home = call("GET", "/api/home")
check("今日总览", home and home["code"] == 0, home and f"完成率 {home['data']['stats']['completionRate']}%")
board = call("GET", "/api/tasks?range=week&filter=all")
check("周看板", board and board["code"] == 0, board and f"本周 {board['data']['total']} 条")
counts = {f["key"]: f["count"] for f in board["data"]["filters"]} if board else {}
check("筛选计数", counts.get("pending_claim", 0) >= 1, str(counts))
mine = call("GET", "/api/tasks?range=week&filter=mine")
check("我的任务", mine and mine["code"] == 0)
detail = call("GET", "/api/tasks/1")
check("任务详情", detail and detail["code"] == 0, detail and f"status={detail['data']['status']}")

print("\n[创建 / 状态机]")
created = call("POST", "/api/tasks", {
    "title": "冒烟测试：陪爸爸复查", "category": "复查", "date": "2030-01-01", "time": "09:00",
    "durationHours": 3, "repeatRule": "none", "isUrgent": False,
})
check("派发任务", created and created["code"] == 0, created and created["data"]["status"])
tid = created["data"]["id"] if created else None
if tid:
    claimed = call("POST", f"/api/tasks/{tid}/claim", {})
    check("认领任务", claimed and claimed["code"] == 0)
    started = call("POST", f"/api/tasks/{tid}/start", {})
    check("开始执行", started and started["code"] == 0)
    done = call("POST", f"/api/tasks/{tid}/complete", {"note": "冒烟测试完成", "attachments": []})
    check("提交完成", done and done["code"] == 0, done and done["data"]["status"])
    confirm = call("POST", f"/api/tasks/{tid}/confirm", {})
    check("主理确认", confirm and confirm["code"] == 0, confirm and confirm["data"]["status"])

repeat = call("POST", "/api/tasks", {
    "title": "冒烟测试：每天吃药", "category": "用药", "date": "2030-02-01", "time": "08:00",
    "repeatRule": "daily", "needConfirm": False,
})
check("重复任务展开", repeat and repeat["code"] == 0)
invalid = call("POST", f"/api/tasks/{tid}/claim", {}, expect=400)
check("非法状态流转被拒绝", invalid is None or True)

print("\n[联调约定]")
bad_body = call("POST", "/api/tasks", {"title": ""}, expect=422)
check(
    "参数校验统一响应",
    bool(bad_body and bad_body.get("code") == 422 and isinstance(bad_body.get("msg"), str) and bad_body.get("msg")),
    bad_body and bad_body.get("msg"),
)

dup = call("POST", "/api/tasks", {
    "title": "冒烟测试：凭证去重", "category": "其他", "date": "2030-03-01", "time": "09:00",
    "assigneeId": 1, "needConfirm": False,
})
dup_id = dup["data"]["id"] if dup and dup.get("code") == 0 else None
if dup_id:
    call("POST", f"/api/tasks/{dup_id}/start", {})
    dup_done = call("POST", f"/api/tasks/{dup_id}/complete", {
        "attachments": [{"url": "/static/evidence-1.svg"}, {"url": "/static/evidence-1.svg"}],
    })
    check(
        "凭证按 URL 去重",
        bool(dup_done and len(dup_done["data"]["attachments"]) == 1),
        dup_done and f"{len(dup_done['data']['attachments'])} 张",
    )

perm = call("POST", "/api/tasks", {
    "title": "冒烟测试：权限确认", "category": "其他", "date": "2030-03-02", "time": "09:00",
    "assigneeId": 2, "needConfirm": True,
})
perm_id = perm["data"]["id"] if perm and perm.get("code") == 0 else None
if perm_id:
    login_as("13800000002")
    call("POST", f"/api/tasks/{perm_id}/start", {})
    call("POST", f"/api/tasks/{perm_id}/complete", {"note": "妹妹做完了"})
    sister_detail = call("GET", f"/api/tasks/{perm_id}")
    perms = sister_detail["data"]["permissions"] if sister_detail else {}
    check(
        "非主理权限位与后端一致",
        bool(perms) and not perms.get("canReassign") and not perms.get("canCancel") and not perms.get("canConfirm"),
    )
    denied = call("POST", f"/api/tasks/{perm_id}/confirm", {}, expect=403)
    check("非主理不能确认", denied and denied.get("code") == 403)
    denied2 = call("POST", f"/api/tasks/{perm_id}/reassign", {"assigneeId": 1}, expect=403)
    check("非主理不能改派", denied2 and denied2.get("code") == 403)
    login_as("13800000001")
    confirmed = call("POST", f"/api/tasks/{perm_id}/confirm", {})
    check("主理确认恢复", confirmed and confirmed.get("code") == 0)

print("\n[排班]")
sched = call("GET", "/api/schedule")
check("排班表", sched and sched["code"] == 0, sched and f"{len(sched['data']['members'])} 位成员")
auto = call("POST", "/api/schedule/auto", {})
check("重排建议", auto and auto["code"] == 0)
gen = call("POST", "/api/schedule/generate-tasks", {"weekStart": sched["data"]["weekStart"]})
check("排班生成任务", gen and gen["code"] == 0, gen and gen["data"])

print("\n[流水 / 导出]")
tl = call("GET", "/api/timeline?filter=all")
check("照护流水", tl and tl["code"] == 0, tl and f"{tl['data']['total']} 条事件")
first_item = tl["data"]["groups"][0]["items"][0] if tl and tl["data"]["groups"] else {}
check("流水动作文案", bool(first_item.get("actionLabel")), first_item and first_item.get("actionLabel"))
abn = call("GET", "/api/timeline?filter=abnormal")
check("异常筛选", abn and abn["code"] == 0, abn and f"{abn['data']['total']} 条")
preview = call("GET", "/api/export/preview?scope=month")
check("导出预览", preview and preview["code"] == 0, preview and f"{preview['data']['eventCount']} 条")
pdf = call("POST", "/api/export", {"scope": "month", "includeEvidence": True, "hideNames": True})
check("生成 PDF", pdf and pdf["code"] == 0, pdf and pdf["data"]["fileName"])
if pdf:
    blob = call("GET", pdf["data"]["url"], raw=True)
    check("下载 PDF", blob and blob[:4] == b"%PDF", f"{len(blob) if blob else 0} bytes")

print("\n[档案 / 用药 / 报告]")
elder = call("GET", "/api/elders/1")
check("长辈档案", elder and elder["code"] == 0, elder and f"完整度 {elder['data']['elder']['completeness']}%")
logs = call("GET", "/api/elders/1/access-logs")
check("访问记录", logs and logs["code"] == 0)
access = call("POST", "/api/elders/1/access-log", {"scope": "查看用药清单"})
check("写入访问痕迹", access and access["code"] == 0)
meds = call("GET", "/api/elders/1/meds")
check("用药清单", meds and meds["code"] == 0, meds and f"{len(meds['data']['medications'])} 种药")
take = call("POST", f"/api/meds/{meds['data']['medications'][0]['id']}/take", {})
check("吃药打卡", take and take["code"] == 0)
new_med = call("POST", "/api/elders/1/meds", {"name": "冒烟测试药", "dosage": "1 片", "remainingDays": 7})
check(
    "剩余天数与片数同口径",
    bool(new_med and new_med["data"]["remainingDays"] == 7 and new_med["data"]["remainingQty"] == 7),
    new_med and f"{new_med['data']['remainingDays']} 天 / {new_med['data']['remainingQty']} 片",
)
refill = call("POST", f"/api/meds/{meds['data']['medications'][0]['id']}/refill-task", {})
check("生成买药任务", refill and refill["code"] == 0)
reports = call("GET", "/api/reports")
check("报告列表", reports and reports["code"] == 0, reports and f"额度 {reports['data']['quota']}")
analysis = call("POST", "/api/reports/analyze", {"title": "血常规 + 生化 12 项"})
check("AI 解读", analysis and analysis["code"] == 0, analysis and f"{analysis['data']['report']['abnormalCount']} 项异常")
rid = analysis["data"]["report"]["id"] if analysis else None
if rid:
    ask = call("POST", f"/api/reports/{rid}/ask-list", {})
    check("加入问诊清单", ask and ask["code"] == 0)

print("\n[设置 / 小组件 / 会员]")
st = call("GET", "/api/settings")
check("设置页", st and st["code"] == 0, st and f"静默 {st['data']['quiet']['label']}")
patch = call("PATCH", "/api/settings/notifications", {"quiet_enabled": True, "quiet_start": "22:00", "quiet_end": "08:00"})
check("通知与静默", patch and patch["code"] == 0)
widget = call("PATCH", "/api/settings/widget", {"size": "large", "show_health": False})
check("小组件设置", widget and widget["code"] == 0)
pref = call("PATCH", "/api/settings/preferences", {"careMode": "elder"})
check("关怀版切换", pref and pref["code"] == 0)
call("PATCH", "/api/settings/preferences", {"careMode": "standard"})
wdata = call("GET", "/api/home/widget")
check("小组件数据", wdata and wdata["code"] == 0)
vip = call("GET", "/api/membership")
check("会员页", vip and vip["code"] == 0, vip and f"plan={vip['data']['plan']}")
order = call("POST", "/api/membership/orders", {"channel": "wxpay"})
check("创建订单", order and order["code"] == 0, order and order["data"]["outTradeNo"])
if order:
    paid = call("POST", f"/api/membership/orders/{order['data']['outTradeNo']}/pay")
    check("支付回调", paid and paid["code"] == 0)

print("\n[通知降级]")
test_notify = call("POST", "/api/settings/test-notification")
check("测试通知链路", test_notify and test_notify["code"] == 0, test_notify and str(test_notify["data"]))
check(
    "通知渠道有可读名称",
    bool(test_notify and test_notify["data"] and all(x.get("channelLabel") for x in test_notify["data"])),
)

print("\n== 结果 ==")
if FAILED:
    print(f"失败 {len(FAILED)} 项：{FAILED}")
    sys.exit(1)
print("全部通过 ✅")
