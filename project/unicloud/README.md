# uniCloud 对接层

本工程默认使用**本机 Python 服务 + SQLite** 运行，这样不需要开通云空间、不需要实名与备案，
双击 `一键启动.bat` 就能完整演示 15 屏。

同时，工程的接口语义与数据模型按 uniCloud 的习惯设计，需要上云时按下面的映射替换即可。
**前端页面与接口调用完全不用改**，只改 `frontend/src/api/request.js` 里的 `BASE_URL`
（或把 `unicloud/cloudfunctions/jiadeng-api` 作为统一入口）。

## 一、能力映射

| uniCloud 能力 | 本工程实现 | 上云替换方式 |
| --- | --- | --- |
| **uni-id** | `POST /api/auth/login｜face｜register`、`GET /api/auth/me`、`PBKDF2 + HS256 JWT` | 换成 `uni-id-co` 的 `login/register/checkToken`，把 `deps.current_user` 换成 `uniIdToken` 校验 |
| **uni-pay** | `POST /api/membership/orders` → `POST /orders/{no}/pay` → `POST /refund` | 用 `uni-pay-co` 的 `createOrder`，回调里做验签 + 幂等，再调用同一套「发权益」逻辑 |
| **uni-push** | `services/notify.py` 的降级链路 + `notification_logs` | `uni-push-co` 的 `sendMessage`，按 `push_clientid` 下发；失败再降级微信/短信 |
| **uni-admin** | `/docs`（Swagger）与 `export/records`、`access-logs` 等查询接口 | 用 uni-admin 建后台页面，直接读 `tasks / task_events / users` 集合 |
| **uniCloud 数据库** | SQLAlchemy 模型（`backend/models.py`）+ SQLite | 用 `unicloud/database/*.schema.json` 建集合，把 ORM 查询换成 `db.collection()` |

## 二、目录

```
unicloud/
├─ README.md
├─ cloudfunctions/
│  └─ jiadeng-api/            # 统一入口：把请求转给任意后端（Python / 自建网关）
│     ├─ index.js
│     └─ package.json
└─ database/
   ├─ users.schema.json       # uni-id-users 的精简版
   ├─ tasks.schema.json
   ├─ task-events.schema.json
   └─ elders.schema.json
```

## 三、用云函数代理本机后端（联调）

1. 在 HBuilderX 里关联云服务空间，上传 `cloudfunctions/jiadeng-api`；
2. 云函数环境变量里配置 `JIADENG_API_BASE`（例如内网穿透后的 Python 地址）；
3. 前端把 `BASE_URL` 改成云函数 URL 化地址，或在 `request.js` 里改用 `uniCloud.callFunction`。

云函数只做转发与统一错误包装，不写业务逻辑，避免两套实现漂移。

## 四、迁移到 uniCloud 数据库

1. 用 `database/*.schema.json` 在 uniCloud 控制台建集合（其余表按 `backend/models.py` 同名字段补齐）；
2. 把 `seed.py` 的数据导成 JSON 后 `db.collection('tasks').add(...)`；
3. 逐步替换：
   - `tasks_service.py` → 云函数 `task-service`（状态机逻辑可原样搬 JS）；
   - `services/notify.py` → 调用 `uni-push-co`；
   - `services/pdf.py` → 云函数里用 `pdf-lib` 或保持 Python 生成后存云存储；
4. 前端 API 层不变，继续按 `{code, msg, data}` 解包。

## 五、注意

- 云函数有冷启动与执行时长限制，PDF 生成、批量重复任务展开建议放到云函数 URL 化或独立服务；
- `task_events` 在 uniCloud 里应设置 `permission.update = false`、`permission.delete = false`，
  用数据库权限兜住「只增不改」这条产品底线；
- 健康档案属于敏感信息，云端存储请开启字段级权限，只允许家庭组内被授权成员读取。
