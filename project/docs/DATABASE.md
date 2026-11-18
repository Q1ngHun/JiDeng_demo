# 家灯 JiaDeng · 数据库设计

- 引擎：SQLite（默认，文件 `backend/data/jiadeng.db`）
- ORM：SQLAlchemy 2.0，模型见 `backend/models.py`
- 建表：首次启动自动执行 `Base.metadata.create_all()`；同时导出 `docs/schema.sql`
- 迁移到 PostgreSQL / MySQL：修改 `JIADENG_DB` 环境变量即可，字段类型均为通用类型

## 一、关系图

```
users ──┬── family_members ──── families ──── elders ──┬── medications
        │        │                                     ├── follow_ups
        │        │                                     ├── reports
        │        │                                     └── access_logs
        │        │
        │        ├── tasks ──┬── task_events（只增不改的流水）
        │        │           └── attachments（凭证）
        │        ├── notification_settings / widget_settings / user_settings
        │        ├── notification_logs
        │        └── pay_orders
        │
        ├── schedule_slots（排班格）
        ├── export_records（导出留痕）
        └── memberships（家庭会员）
```

## 二、表说明

### users（对应 uni-id-users）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| username | varchar(32) unique | 手机号，登录名 |
| password_hash | varchar(255) | `pbkdf2_sha256$迭代$盐$摘要` |
| nickname / real_name | varchar | 昵称 / 真实姓名 |
| avatar_text / avatar_color | varchar | 头像字与配色（owner/sis/dad/mom） |
| phone / openid / unionid / push_clientid | varchar | uni-id / uni-push 标识 |
| role | varchar(16) | owner / member / elder |
| is_demo | bool | 演示账号标记 |

### families / family_members

- `families`：名称、主理人、邀请码、套餐（free/vip）、成员上限。
- `family_members`：家庭 × 用户，`relation`（主理子女/妹妹/爸爸/妈妈）、`role`、逐项授权
  （`can_view_meds` / `can_view_history` / `can_view_reports`）。
- 排班、任务、档案都挂在 `family_id` 下，权限判断以 `family_members` 为准。

### elders（长辈档案）

基础信息（生日/身高/体重/血型）、既往史、过敏史、常去医院与医生、下次复查、`completeness`（0–100）。

完整度算法：`已填字段 / 10`（姓名 + 下次复查 + 8 个档案字段），演示数据为 80%。

### tasks

| 字段 | 说明 |
| --- | --- |
| title / category / description | 事项与分类（复查/取药/测量/缴费/用药/其他） |
| creator_id / assignee_id | 创建人 / 责任人（空 = 待认领） |
| scheduled_at / due_at | 计划时间 / 截止时间（默认 +3 小时） |
| is_urgent | 可穿透静默时段 |
| repeat_rule | none / daily / weekly / monthly |
| need_confirm | 完成后是否需要主理确认 |
| status | 7 态：pending_claim / claimed / in_progress / pending_confirm / done / overdue / question，另有两个终态 cancelled / skipped |
| source | manual / medication / followup / schedule |
| claimed_at / started_at / completed_at / confirmed_at / timeout_at | 各节点时间 |
| evidence_count | 由 attachments 派生（接口层计算） |

### task_events

| 字段 | 说明 |
| --- | --- |
| family_id / task_id | task_id 允许为空（导出这类系统事件） |
| actor_id / actor_name | 操作者（系统事件为「系统」） |
| action | create / claim / start / complete / confirm / remind / reassign / cancel / skip / question / timeout / attachment / export |
| from_status / to_status | 状态迁移留痕 |
| note | 备注（如「超时 26 小时 · 无人认领」） |
| created_at | 发生时间，流水按此倒序 |

**没有任何删除接口**；取消也只是一条终态事件。

### attachments

凭证：`kind`（image/audio）、`url`、`duration`（语音时长）、`uploaded_by`。

### medications / follow_ups

- 用药：剂量、频次、服用时间、开始/结束日期、总天数、剩余天数与片数、状态（active/stopped）。
  `percent = remaining_days / total_days`，`needBuy = 剩余 ≤14 天`；打卡扣 1，停用保留历史。
- 复诊：周期天数、上次/下次日期、`need_confirm`（默认 True，生成任务前需主理确认）。

### reports

`indicators`（JSON 数组，含参考范围与 high/low/normal）、三段式摘要、`questions`（JSON）、
`confidence`、`status`（archived/pending_ask）、固定 `disclaimer`。

### access_logs

档案访问痕迹：`viewer_id/name`、`viewer_tag`（本人/已授权/导出）、`scope`（查看全部/查看用药清单/导出照护记录）、`action`。

### 设置三表

- `notification_settings`：push/wechat/sms、三类事件开关、静默时段与紧急穿透。
- `widget_settings`：尺寸、显示项、健康数据开关（默认 false）、锁屏活动。
- `user_settings`：关怀版模式、字号、最近同步、离线缓存条数、生物识别开关。

### memberships / pay_orders

- `memberships`：家庭套餐、价格、生效/到期、是否自动续费、可退款截止时间、状态。
- `pay_orders`：uni-pay 语义的 `out_trade_no`、金额（分）、渠道、状态（created/paid/refunded）、交易号与时间。

### schedule_slots

`(family_id, member_id, day)` 唯一；`has_duty` 色块只表示「有人负责」，`label` 是当天分工描述。

### export_records / notification_logs

- 导出记录：范围、选项 JSON、事件数、文件名、时间（同时写 access_log 与 task_event）。
- 通知日志：渠道、标题、正文、状态（sent/failed/skipped_quiet）、降级原因。

## 三、索引与约束

- `users.username` 唯一；`family_members(family_id, user_id)` 唯一；`schedule_slots(family_id, member_id, day)` 唯一。
- 高频查询列建有索引：`tasks.family_id`、`tasks.status`、`tasks.scheduled_at`、`task_events.task_id`、
  `task_events.created_at`、`access_logs.elder_id`、`notification_logs.user_id`。
- 开启外键约束（`PRAGMA foreign_keys=ON`）与 WAL，兼顾一致性与本机并发。

## 四、演示数据

`backend/seed.py` 以「今天」为基准动态生成，包含：

- 1 个家庭（李家，会员至次年）、4 位成员、1 份长辈档案（完整度 80%）
- 17 条本周任务（含进行中、待认领、已完成、已超时、有疑问）
- 33 条流水事件、10 份凭证、2 份报告、3 种药、1 个复诊周期、3 条访问记录
- 本周排班、通知设置、小组件设置、3 条通知日志

所以任何一天打开，都像是一个正在使用的家庭，而不是「2026 年 11 月 18 日」的化石数据。
