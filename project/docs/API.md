# 家灯 JiaDeng · 接口文档

- Base URL：`http://127.0.0.1:8000`
- 统一响应：`{"code": 0, "msg": "ok", "data": ...}`；失败时 HTTP 状态码与 `code` 一致（400/401/402/403/404/422/500）。
- 参数校验失败也走统一结构：`{"code": 422, "msg": "参数有误：任务标题不能为空", "data": null}`，不会返回 FastAPI 默认的 `detail` 数组。
- 鉴权：除登录/注册/健康检查外，均需 `Authorization: Bearer <token>`。
- 时间格式：`YYYY-MM-DDTHH:mm:ss`，日期 `YYYY-MM-DD`，时区为北京时间（UTC+8）。
- 在线文档：`/docs`（Swagger UI）与 `/redoc`。

## 1. 登录与会话（对应 uni-id）

| 方法 | 路径 | 入参 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | `{username, password}` | 手机号 + 密码登录，返回 token、用户、家庭、成员、长辈、偏好 |
| POST | `/api/auth/face` | `{username?}` | 面容解锁（演示）；不传用户名时使用演示主账号 |
| POST | `/api/auth/register` | `{username, password, realName}` | 注册并自动创建家庭组、默认设置 |
| GET | `/api/auth/me` | — | 会话刷新：家庭成员、长辈、会员、同步状态 |
| POST | `/api/auth/logout` | — | 前端清除本地 token |

`login/face` 返回：

```json
{
  "token": "eyJ...",
  "user": {"id": 1, "name": "王芳", "avatarText": "芳", "avatarColor": "owner", "role": "owner"},
  "family": {"id": 1, "name": "李家", "inviteCode": "JIADENG", "plan": "vip", "memberLimit": 8},
  "member": {"id": 1, "relation": "主理子女", "role": "owner", "permissions": {...}},
  "members": [...],
  "elder": {...},
  "preferences": {"careMode": "standard", "fontScale": 1.0, "biometric": true},
  "widget": {"size": "medium"},
  "version": "0.1.0"
}
```

## 2. 首页

### GET /api/home

```json
{
  "greeting": "早上好", "userName": "王芳", "dateLabel": "11月18日 周三", "connectDays": 12,
  "sync": {"online": true, "label": "已同步", "lastSyncLabel": "今天 08:12", "cachedTasks": 34, "tip": "离线也可查看与打卡"},
  "members": [...],
  "stats": {
    "weekRange": "11/16 – 11/22", "completionRate": 59, "doneCount": 10, "totalCount": 17,
    "deltaVsLastWeek": 2,
    "bars": [{"weekday": "一", "date": "11-16", "value": 100, "total": 4, "done": 4, "isToday": false}, ...],
    "kpi": {"pendingClaim": 1, "pendingConfirm": 0}
  },
  "kpi": {"nextCheckupDays": 6, "nextCheckupLabel": "下次复查"},
  "todayTasks": [task...],
  "quickActions": [{"key": "create", "label": "派任务", "icon": "plus", "path": "/pages/create/create"}, ...],
  "elder": {"id": 1, "name": "王建国", "nextCheckup": "2026-11-24"},
  "membership": {"plan": "vip"},
  "version": "0.1.0"
}
```

长辈角色（`member.role == "elder"`）只会拿到「自己或待认领」的今日任务。

### GET /api/home/widget

桌面小组件数据：`size`、`familyName`、`dateLabel`、`pendingCount`、`tasks`（最多 3 条未完成）。
按设计约束**不含任何健康数据**。

## 3. 任务

### GET /api/tasks

| 参数 | 说明 |
| --- | --- |
| `range` | `week`（默认）/ `today` / `all` |
| `day` | 指定日期 `YYYY-MM-DD`，优先于 range |
| `filter` | `all` / `mine` / `pending_claim` |
| `status` | 任一状态键，用于「筛选」弹层 |

返回 `filters`（三个 chip 的计数）、`weekDays`（日期条）、`days`（按天分组，含 `hasOpen`、`count`）。

### GET /api/tasks/meta

分类、成员、模板、重复选项、提醒选项、状态文案、长辈信息。

### POST /api/tasks

```json
{
  "title": "陪爸爸去市一院心内科复查",
  "category": "复查",
  "date": "2026-11-19", "time": "09:00",
  "durationHours": 3,
  "assigneeId": null,
  "repeatRule": "none",
  "isUrgent": false,
  "location": "市一院 3 号楼",
  "remindLabel": "提前 1 天 20:00",
  "needConfirm": true
}
```

`assigneeId` 为空即「待认领」。`repeatRule` 非 `none` 时会展开后续实例。

### GET /api/tasks/{id}

返回任务全字段 + `events`（进度）+ `attachments`（凭证）+ `permissions`：

```json
"permissions": {
  "canClaim": true, "canStart": false, "canComplete": false,
  "canConfirm": false, "canReassign": true, "canRemind": true,
  "canCancel": true, "canSkip": false, "canUpload": false, "canAsk": false
}
```

### 状态流转

| 接口 | 作用 | 前置状态 |
| --- | --- | --- |
| `POST /{id}/claim` | 认领 | 待认领 / 有疑问 / 已超时 |
| `POST /{id}/start` | 开始 | 已认领 / 待认领 / 已超时 / 有疑问，且只能是责任人或待认领任务 |
| `POST /{id}/complete` | 提交完成（可带凭证） | 已认领 / 进行中 / 已超时，且只能是责任人 |
| `POST /{id}/confirm` | 主理确认 | 待确认，仅主理或任务创建人 |
| `POST /{id}/remind` | 提醒责任人 | 未结束 |
| `POST /{id}/reassign` | 改派 `{assigneeId, reason}` | 未结束，仅主理 |
| `POST /{id}/cancel` | 取消并说明 `{reason}` | 未结束，仅主理 |
| `POST /{id}/skip` | 跳过本次（重复任务） | 未结束 |
| `POST /{id}/question` | 有疑问 `{note}` | 已认领 / 进行中 |
| `POST /{id}/attachments` | 上传凭证（multipart：`file`, `kind`, `duration`） | 仅责任人；未认领需先认领 |

`permissions` 与后端校验保持一致：非主理 `canReassign/canCancel=false`，非责任人 `canUpload/canComplete=false`，
非主理且非创建人 `canConfirm=false`。前端直接按这些布尔值渲染按钮，避免“点了才报 403”。

`complete` 的 `attachments[].url` 若已经通过 `/attachments` 上传过，会按 URL 去重，不会重复入库。

## 4. 排班

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/schedule?weekStart=YYYY-MM-DD` | 7 天 × 成员矩阵、duties、图例、`canEdit` |
| POST | `/api/schedule/slot` | `{memberId, date, hasDuty?, label?}` 切换某格（仅主理） |
| POST | `/api/schedule/auto` | 按分工建议重排本周 |
| POST | `/api/schedule/generate-tasks` | 把有班次的格子生成任务，`{weekStart}` |

## 5. 照护流水

`GET /api/timeline?filter=all|done|abnormal|evidence&page=1&pageSize=20`

```json
{
  "filters": [{"key": "all", "label": "全部", "count": 33}, ...],
  "groups": [{
    "date": "2026-11-18", "dateLabel": "11月18日 周三", "count": 3,
    "items": [{
      "id": 12, "taskId": 1, "action": "complete", "actionLabel": "完成", "tone": "good",
      "title": "王丽 完成「量血压并记录」", "note": "138/86 mmHg · 照片 1 张",
      "time": "11:42", "relative": "今天 11:42", "attachments": [...],
      "canReassign": false, "canCancel": false
    }]
  }],
  "total": 33, "hasMore": true,
  "notice": "只增不改 · 不可删除 · 支持导出 PDF 给医生"
}
```

## 6. 长辈档案

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/elders/{id}` | 档案、完整度、字段列表、用药数、授权人数、复诊周期、访问记录 |
| PATCH | `/api/elders/{id}` | 仅主理；字段任意子集，自动重算完整度 |
| GET | `/api/elders/{id}/access-logs` | 谁看过，精确到「看了哪一部分」 |
| POST | `/api/elders/{id}/access-log` | `{scope, action}` 记录一次查看 / 导出 |

## 7. 用药与复诊

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/elders/{id}/meds` | 药品（含 `remainingDays/percent/needBuy`）、复诊周期、免责说明 |
| POST | `/api/elders/{id}/meds` | 新增药品：`{name, dosage, frequency, timing, totalDays, remainingDays, remainingQty, startDate, note}`；只填 `remainingDays` 时，`remainingQty` 默认与它一致 |
| POST | `/api/meds/{id}/take` | 打卡，剩余量 -1 |
| POST | `/api/meds/{id}/refill-task` | 生成「去社区医院取 X」任务 |
| POST | `/api/meds/{id}/stop` | 停用但保留历史 |
| POST | `/api/follow-ups/{id}/generate-task` | 生成复诊任务（需主理，落到待确认） |

## 8. 报告解读

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/reports?elderId=` | 列表 + 最近一次 + 本月额度 + 免责声明 |
| POST | `/api/reports/analyze` | `{title, imageUrl}`，返回三段式解读并归档；次数受会员额度限制 |
| POST | `/api/reports/{id}/ask-list` | 加入问诊清单（状态改 `pending_ask`） |
| POST | `/api/reports/{id}/archive` | 归档 |

解读结果固定三段：`summary_abnormal`（哪几项不在范围）、`summary_meaning`（通常和什么有关）、
`summary_advice`（下次可以问医生），外加 `questions` 与不可折叠的 `disclaimer`。**没有自由问答接口。**

## 9. 设置 / 通知

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/settings` | 账号、会员、渠道开关、提醒事件、静默、小组件、缓存、版本、最近投递日志 |
| PATCH | `/api/settings/notifications` | 任意子集：`push/wechat/sms/notify_*/quiet_*/urgent_pass` |
| PATCH | `/api/settings/widget` | `size/show_tasks/show_claim_count/show_next_checkup/show_health/live_activity` |
| PATCH | `/api/settings/preferences` | `careMode`（standard/elder）、`fontScale`、`biometric` |
| POST | `/api/settings/test-notification` | 走一次真实降级链路，返回 `channel/channelLabel/status/degradeReason` |

## 10. 会员（uni-pay 语义）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/membership` | 价格、权益、对比表、当前会员、额度、订单历史 |
| POST | `/api/membership/orders` | `{channel: wxpay|alipay}` → `outTradeNo` + 模拟支付参数 |
| POST | `/api/membership/orders/{no}/pay` | 模拟支付回调（真实项目由 uni-pay notify 触发，需验签 + 幂等） |
| POST | `/api/membership/refund` | 7 天内无理由退款，权益停止、数据只读 |

## 11. 导出

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/export/preview?scope=month&start=&end=&onlyAbnormal=` | 事件数、凭证数、样例、剩余额度、`canExport` |
| POST | `/api/export` | `{scope, start, end, onlyAbnormal, includeEvidence, includeProfile, hideNames}` → PDF 地址 |
| GET | `/api/export/file/{name}` | 下载 PDF |
| GET | `/api/export/records` | 导出历史（同时写访问记录与流水） |

PDF 说明：A4 竖版、微软雅黑、每页水印「仅用于就医沟通」+ 页码；`hideNames` 会把家人姓名替换为「家属A/B」。

## 12. 其他

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| POST | `/api/upload` | 通用图片上传，返回 `/uploads/xxx` |
| POST | `/api/demo/reset` | 重置演示数据（仅本机演示） |

## 错误码约定

| 状态码 | 场景 |
| --- | --- |
| 400 | 参数缺失 / 非法状态流转 / 超期退款 / 无记录可导出 |
| 401 | token 缺失或过期（受保护接口由前端自动回启动页；登录接口的 401 只提示账号密码错误） |
| 402 | 会员额度不足（导出、AI 解读） |
| 403 | 角色无权限（非主理改派、长辈编辑档案等） |
| 404 | 任务 / 档案 / 文件不存在 |
| 422 | 请求体字段校验失败（统一转成中文 `msg`） |
| 500 | 服务端异常（只返回通用提示，详细堆栈写在服务端日志） |

## 前端联调约定（`frontend/src/api/request.js`）

| 约定 | 说明 |
| --- | --- |
| Base URL | H5 同源部署为空；开发环境由 Vite 代理 `/api`、`/uploads`、`/static`；App / 小程序设置 `VITE_API_BASE` |
| 开发预览 | `vite.config.js` 启动时自动检查 `127.0.0.1:8000`，没有后端会拉起 `backend/main.py` 并等待健康检查；`JIADENG_SKIP_BACKEND=1` 可关闭 |
| 代理异常 | 后端未启动时 Vite 代理返回 `{"code":502,"msg":"后端服务未启动或已退出"}`，前端按普通错误提示展示 |
| 资源地址 | 后端返回的 `/uploads/x.png`、`/static/x.svg` 统一经过 `assetUrl()` 拼接，避免 App 端相对路径加载失败 |
| 成功提示 | 需要服务端文案的接口传 `withMessage: true`，返回 `{data, msg}`；其余接口仍直接返回 `data` |
| 并发去重 | GET 请求按「方法 + URL + token」复用进行中的 Promise，兼容页面 `onMounted` + `onShow` 双触发 |
| 401 | 仅 `auth !== false` 的请求清理会话并回启动页；登录/面容解锁的 401 原样提示，不会误清会话 |
| 上传 | 凭证与化验单统一走 `upload()`，共用 Base URL、token 与错误提示 |
| 错误提示 | 优先取后端 `msg`，网络错误区分为「请求超时」与「网络不可用」 |
