# 家灯 JiaDeng · 家庭照护协作 App

## 一、快速开始

### 1. 一键启动（推荐）

双击 **`一键启动.bat`**。

脚本会自动：

1. 检查 Python 3.9+ 与依赖（fastapi / uvicorn / SQLAlchemy / reportlab / python-multipart），缺少时自动安装；
2. 检查前端构建产物，若本机有 Node.js 且产物缺失则自动 `npm install && npm run build:h5`；
3. 检查端口：如果 8000 上已有家灯服务，会自动重启以加载最新代码；如果是其他程序占用，则自动改用 8001–8010；
4. 预检后端代码，启动服务并打开浏览器（端口不是 8000 时会自动打开实际端口）。

> 已存在 `frontend/dist/build/h5` 时脚本不会自动重建。改过前端源码后，请手动执行
> `cd frontend && npm run build:h5`，再重启后端。

第一次启动会自动创建数据库（`backend/data/jiadeng.db`）并写入与设计稿一致的演示数据。
关闭窗口或 `Ctrl+C` 停止服务；如果服务在后台运行，双击 **`停止服务.bat`** 即可停止
（会检查 8000–8010，只停止家灯自己的 Python 进程，不会误杀其他程序）。

启动脚本支持参数，双击 `.bat` 时也可以直接追加：

| 命令 | 作用 |
| --- | --- |
| `一键启动.bat -CheckOnly` | 只做环境、依赖、构建产物和端口检查，不启动服务 |
| `一键启动.bat -Port 8010` | 指定端口；被占用时会给出明确提示 |
| `一键启动.bat -NoBrowser` | 启动服务但不自动打开浏览器 |
| `停止服务.bat` | 停止 8000–8010 上正在运行的家灯服务 |

### 2. 手动启动

```bash
# 后端（会自动建库 + 写演示数据）
cd backend
pip install -r requirements.txt
python main.py

# 前端（可选，仅在修改界面后需要）
cd frontend
npm install
npm run build:h5     # 构建后由 Python 直接托管，同源无跨域
```

### 3. 开发模式（前后端分离 + 热更新）

双击 **`开发模式.bat`**，或：

```bash
cd backend && python main.py --no-browser     # 8000
cd frontend && npm run dev:h5                 # 5173，/api 已代理到 8000
```

脚本会先检查 Node.js 18+、Python 依赖和 8000 端口，等后端健康检查通过后再启动 Vite；
后端日志写到 `backend/data/dev-backend.log`，按 `Ctrl+C` 会同时停止前后端。
需要换端口时执行 `开发模式.bat -Port 8010`，Vite 的 `/api` 代理会通过
`JIADENG_PORT` 自动指向同一个后端端口。

另外，`vite.config.js` 自身也会在预览启动时检查后端：如果 8000 没有服务，会自动拉起
`backend/main.py` 并等待健康检查通过，避免 HBuilderX 预览时出现代理 500。
不想自动启动时设置 `JIADENG_SKIP_BACKEND=1`；使用远程后端时设置 `JIADENG_API_TARGET`。

### 4. 演示账号

| 手机号 | 密码 | 身份 | 能看到的差异 |
| --- | --- | --- | --- |
| 13800000001 | 123456 | 王芳 · 主理子女 | 全部权限：派任务、排班、确认、导出、会员 |
| 13800000002 | 123456 | 王丽 · 妹妹 | 协作成员：只能操作自己的任务、看被授权的档案 |
| 13800000003 | 123456 | 王建国 · 爸爸 | 关怀版视角：只看「今天我要做什么」，一键完成 |
| 13800000004 | 123456 | 李秀兰 · 妈妈 | 协作成员 |

启动页点「用面容解锁」默认进入王芳；点「切换演示身份」可以在四个视角之间切换，
同一份家庭数据会呈现完全不同的界面与权限。

其他入口：

- 接口文档（Swagger）：<http://127.0.0.1:8000/docs>
- 原始设计原型：<http://127.0.0.1:8000/design/index.html>
- 重置演示数据：`python backend/tools/reset_demo.py`，或 `POST /api/demo/reset`

---

## 二、15 屏实现对照

| # | 屏幕 | 路由 | 真实能力 |
| --- | --- | --- | --- |
| 01 | 启动与解锁 | `pages/launch/launch` | 面容解锁（演示）、会话持久化、上次同步/离线缓存状态；登录失败只提示、不误清会话 |
| 02 | 首页 · 今日总览 | `pages/home/home` | 完成率环 + 周柱状图 + 3 KPI + 今日任务 + 同步状态条 + 认领 |
| 03 | 任务看板（周视图） | `pages/board/board` | 日期条、按天分组、我的/待认领筛选、状态筛选、内联认领 |
| 04 | 家庭成员排班 | `pages/schedule/schedule` | 7×成员二维表、点格排班、一键重排、排班生成任务 |
| 05 | 派发任务 | `pages/create/create` | 模板、日期时间、任务类型、重复规则展开、责任人、紧急开关、确认开关 |
| 06 | 任务详情与异常处理 | `pages/detail/detail` | 倒计时条、7 态流转、`permissions` 驱动按钮、凭证上传（按 URL 去重）、改派/提醒/取消/跳过/提问 |
| 07 | 照护流水 | `pages/timeline/timeline` | 只增不改、按天分组、分页按日期合并、异常筛选、凭证缩略图、按角色显示补救动作 |
| 08 | 导出照护记录 PDF | `pages/export/export` | 范围/内容可配、隐藏姓名、真实生成带水印 PDF、额度校验、下载地址统一解析 |
| 09 | 长辈档案与访问记录 | `pages/profile/profile` | 完整度、逐字段编辑、访问痕迹（精确到看了哪一部分）、复诊周期 |
| 10 | 用药清单 | `pages/meds/meds` | 剩余量进度条、打卡扣减、剩余天数/片数同口径、该买药了生成任务、停用药留档 |
| 11 | 报告解读 | `pages/report/report` | 拍照上传、三段式模板、置信度、指标高亮、加入问诊清单 |
| 12 | 桌面小组件设置 | `pages/widget/widget` | 三种尺寸预览、内容开关、下次复查取真实档案、健康数据默认关闭、锁屏活动 |
| 13 | 通知渠道与静默 | `pages/settings/settings` | 渠道开关、降级链路、静默时段、测试提醒链路（显示渠道中文名）、退出登录 |
| 14 | 家庭会员 | `pages/vip/vip` | 99 元/年、权益表、uni-pay 风格下单-支付-退款、额度计算 |
| 15 | 关怀版模式 | `pages/elder/elder` | 32sp 大字、120 高主按钮、一屏一卡、一键完成、字号开关、偏好回写会话 |

底部 5 个 Tab：首页 / 看板 / 流水 / 档案 / 我的（自定义 tabbar，图标为线性 SVG）。

---

## 三、技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 前端框架 | uni-app 3（Vue 3.4 + Vite 5） | 一套代码可构建 H5 / App / 微信小程序 |
| 组件库 | uview-plus 3.8（uView 2.x 的 Vue3 版本） | `u-popup` 底部弹层、`u-loading-icon`、`u-modal` 等；uView 2.0 本身仅支持 Vue2，所以 Vue3 工程使用其官方延续版 uview-plus，API 与设计规范一致 |
| 状态 | Vue `reactive` 轻量 store + uni.storage | 无额外依赖 |
| 请求层 | `src/api/request.js` 统一封装 | `{code,msg,data}` 解包、401 分流、GET 并发去重、`withMessage`、资源地址 `assetUrl`、文件 `upload` |
| 后端 | Python 3.9+ / FastAPI | 自动生成 OpenAPI 文档；422 校验错误同样使用统一信封 |
| ORM | SQLAlchemy 2.0 | 模型即文档，启动自动建表 |
| 数据库 | SQLite（默认，零安装） | 生产可无缝换 PostgreSQL / MySQL |
| PDF | reportlab | 嵌入微软雅黑，带水印与页码 |
| 鉴权 | 标准库实现的 HS256 JWT + PBKDF2 口令散列 | 不引入多余依赖 |

> 关于 uniCloud：工程按 uniCloud 的分层习惯组织（uni-id / uni-pay / uni-push / uni-admin 的接口语义一一对应），
> 但运行时使用本机 Python 服务，避免必须开通云空间才能演示。迁移说明见 [`unicloud/README.md`](unicloud/README.md)。

---

## 四、目录结构

```
APP/
├─ 一键启动.bat             # 双击即可：查依赖 → 查端口 → 起服务 → 开浏览器
├─ start.ps1                # 一键启动实际逻辑（-CheckOnly / -Port / -NoBrowser）
├─ 停止服务.bat              # 停止 8000–8010 上的家灯服务
├─ 开发模式.bat / .ps1       # 前后端分离 + 热更新，启动前校验后端健康状态
├─ README.md
├─ docs/
│  ├─ API.md                # 接口清单与约定
│  ├─ DATABASE.md           # 表结构与关系
│  ├─ ARCHITECTURE.md       # 运行架构与关键流程
│  └─ schema.sql            # 导出的建表语句
├─ unicloud/                # uniCloud 对接层（uni-id / uni-pay / uni-push / uni-admin）
├─ backend/
│  ├─ main.py               # FastAPI 入口，托管 H5 + 接口
│  ├─ config.py             # 路径 / 密钥 / 价格 / 额度
│  ├─ models.py             # 19 张表的数据模型
│  ├─ seed.py               # 与设计稿一致的演示数据
│  ├─ security.py           # PBKDF2 + JWT
│  ├─ serializers.py        # 统一出参（状态文案 / 倒计时 / 台账）
│  ├─ routers/              # auth home tasks schedule timeline elders meds reports settings membership export upload
│  ├─ services/             # 任务状态机、通知降级、PDF、报告模板
│  ├─ tools/                # reset_demo / dump_schema
│  ├─ tests/smoke_test.py   # 50+ 接口与联调断言（Windows 控制台 UTF-8 安全）
│  └─ data/                 # SQLite、上传凭证、导出 PDF
└─ frontend/
   ├─ src/pages/            # 15 屏
   ├─ src/components/       # JdNav / JdTabbar / JdIcon / JdRing / JdStatus / JdSwitch / JdAvatar
   ├─ src/api/              # request.js 统一请求/上传 + index.js 按屏分组的接口
   ├─ src/store/session.js  # 登录态与家庭上下文
   ├─ src/styles/common.scss# 设计系统 token 与组件样式
   └─ dist/build/h5/        # 预构建产物，Python 直接托管
```

---

## 五、后端接口总览

接口统一返回 `{ code: 0, msg: "ok", data: ... }`，失败时 HTTP 状态码与 `code` 一致
（400 / 401 / 402 / 403 / 404 / 422 / 500）。参数校验失败（422）也使用同一信封，
`msg` 已转成中文，例如「参数有误：任务标题长度不足」，不会把 FastAPI 的 `detail` 数组直接甩给页面。
除登录、注册、健康检查外，全部需要 `Authorization: Bearer <token>`。

| 模块 | 接口 |
| --- | --- |
| 登录 | `POST /api/auth/login` · `POST /api/auth/face` · `POST /api/auth/register` · `GET /api/auth/me` · `POST /api/auth/logout` |
| 首页 | `GET /api/home` · `GET /api/home/widget` |
| 任务 | `GET /api/tasks` · `GET /api/tasks/meta` · `POST /api/tasks` · `GET /api/tasks/{id}` · `POST /api/tasks/{id}/claim｜start｜complete｜confirm｜remind｜reassign｜cancel｜skip｜question` · `POST /api/tasks/{id}/attachments` |
| 排班 | `GET /api/schedule` · `POST /api/schedule/slot` · `POST /api/schedule/auto` · `POST /api/schedule/generate-tasks` |
| 流水 | `GET /api/timeline?filter=all｜done｜abnormal｜evidence` |
| 档案 | `GET /api/elders/{id}` · `PATCH /api/elders/{id}` · `GET /api/elders/{id}/access-logs` · `POST /api/elders/{id}/access-log` |
| 用药 | `GET /api/elders/{id}/meds` · `POST /api/elders/{id}/meds` · `POST /api/meds/{id}/take｜refill-task｜stop` · `POST /api/follow-ups/{id}/generate-task` |
| 报告 | `GET /api/reports` · `POST /api/reports/analyze` · `POST /api/reports/{id}/ask-list` |
| 设置 | `GET /api/settings` · `PATCH /api/settings/notifications｜widget｜preferences` · `GET /api/settings/notification-logs` · `POST /api/settings/test-notification` |
| 会员 | `GET /api/membership` · `POST /api/membership/orders` · `POST /api/membership/orders/{no}/pay` · `POST /api/membership/refund` |
| 导出 | `GET /api/export/preview` · `POST /api/export` · `GET /api/export/file/{name}` · `GET /api/export/records` |
| 其他 | `POST /api/upload` · `GET /api/health` · `POST /api/demo/reset` |

### 前后端联调约定

| 约定 | 说明 |
| --- | --- |
| Base URL | H5 同源为空；开发环境由 Vite 代理 `/api`、`/uploads`、`/static`；App / 小程序设置 `VITE_API_BASE` |
| 资源地址 | 后端返回的 `/uploads/x.png`、`/static/x.svg` 统一经 `assetUrl()` 拼接，避免原生端相对路径加载失败 |
| 成功提示 | 需要服务端文案的接口传 `withMessage: true`，前端拿到 `{data, msg}`；其余接口仍直接返回 `data` |
| 并发去重 | GET 请求按「方法 + URL + token」复用进行中的 Promise，兼容页面 `onMounted` + `onShow` 双触发 |
| 401 | 仅受保护接口清会话并回启动页；登录/面容解锁的 401 只提示账号密码错误，不误清会话 |
| 上传 | 凭证与化验单统一走 `upload()`，共用 Base URL、token 与错误提示 |
| 错误提示 | 优先取后端 `msg`；网络错误区分「请求超时」与「网络不可用」 |

补充几条与页面直接相关的后端语义：

- `GET /api/tasks/{id}` 的 `permissions` 与后端校验完全一致：非主理 `canReassign/canCancel=false`，
  非责任人 `canUpload/canComplete=false`，非主理且非创建人 `canConfirm=false`，前端按布尔值渲染按钮。
- `POST /api/tasks/{id}/attachments` 仅责任人可传；未认领任务需先认领。
  `complete` 的 `attachments[].url` 若已经上传过，会按 URL 去重，不会重复入库。
- 时间/日期格式错误统一返回 400（中文提示），不再是 500。
- 照护流水新增 `actionLabel`；超时补救按钮的 `canReassign/canCancel` 只对主理返回 `true`。

详细字段见 [`docs/API.md`](docs/API.md) 或运行后打开 `/docs`。

## 六、前后端联调优化

这一轮没有改界面结构，重点是把数据链路收紧：请求、响应、权限、错误提示四层使用同一套约定。

### 1. 请求层（`frontend/src/api/request.js`）

- 新增 `BASE_URL` / `VITE_API_BASE` 支持，H5 同源零配置，App / 小程序可指定后端域名。
- 新增 `assetUrl()`，统一处理 `/uploads`、`/static` 相对地址。
- 401 分流：受保护接口才清会话并回启动页；登录/面容解锁的 401 只提示，不再误清会话。
- GET 并发去重，消除 `onMounted` + `onShow` 的重复请求。
- 新增 `withMessage`，页面直接使用服务端 `msg`，不再硬编码「已打卡/已生成」等提示。
- 新增统一 `upload()`，凭证与化验单上传共用 Base URL、token 与错误处理。
- 网络错误区分「请求超时」与「网络不可用」。

### 2. 响应与校验（`backend/main.py`、`backend/utils.py`）

- 422 参数校验失败返回统一 `{code, msg, data}`，字段错误转中文。
- 日期解析失败从 500 改为 400，并提示合法格式。
- 500 只返回通用提示，详细堆栈写服务端日志，不再暴露内部异常。

### 3. 权限与任务状态（`backend/routers/tasks.py`、`backend/services/tasks_service.py`）

- 任务详情 `permissions` 与后端校验对齐：确认、改派、取消、开始、完成、上传凭证都按角色/责任人判断。
- 非主理调用确认/改派/取消会返回 403，前端按 `permissions` 渲染按钮，避免「点了才报错」。
- 补齐 `claimed / overdue → done / pending_confirm` 合法流转，修复「已认领任务直接完成」报 400。
- 上传凭证仅限责任人；未认领任务需先认领。

### 4. 数据一致性

- 凭证按 URL 去重：先 `/attachments` 上传、再提交完成时，同一张图不会入库两次。
- 用药新增时只填剩余天数，`remainingQty` 默认与之一致，不再出现「剩 7 天 / 剩 30 片」。
- 流水新增 `actionLabel`；超时补救按钮只对主理返回可操作标记。
- 测试提醒返回 `channelLabel`，页面显示「App 推送 / 微信服务通知 / 短信」而不是原始 key。
- `repeatUntil` 正确解析为日期后入库。
- uniCloud 转发函数 health 不再二次包裹响应信封。

### 5. 页面级修复

- 启动页：修复面容解锁成功后给 `computed` 赋值抛错、导致不跳转首页的问题。
- 任务详情：凭证上传失败会中止提交；图片地址统一拼接；操作按钮以 `permissions` 为准。
- 照护流水：分页结果按日期合并，跨页不再出现重复日期分组。
- 用药清单：打卡/买药防重复点击；复诊调整仅主理可操作。
- 长辈档案：修复一次进入写两条访问记录的问题。
- 桌面小组件：下次复查改用 `home.elder.nextCheckup`，不再错误截取同步时间。
- 导出：PDF 下载/复制链接统一走 `assetUrl`；预览请求增加竞态保护。
- 派发任务：新增任务类型选择；关怀版切回标准版后同步本地会话偏好。

### 6. 验证

```bash
cd backend
python tests/smoke_test.py http://127.0.0.1:8000
```

冒烟测试覆盖 50+ 项，新增了参数校验、凭证去重、非主理权限、剩余量口径、流水文案、
通知渠道名称等联调断言，并修复了 Windows 控制台 GBK 输出崩溃。测试会真实创建任务和 PDF，
跑完执行 `python tools/reset_demo.py` 恢复干净演示数据。

---

## 七、测试

```bash
cd backend
python tests/smoke_test.py                          # 默认 http://127.0.0.1:8000
python tests/smoke_test.py http://127.0.0.1:8123    # 或指定端口
```

覆盖登录、首页/看板、状态机、联调约定（422、凭证去重、非主理权限）、排班、流水、
导出、档案、用药、报告、设置、会员、通知降级等 50+ 项断言。

测试会真实创建/推进任务、生成 PDF。跑完想恢复干净演示数据：

```bash
python tools/reset_demo.py
```

---

## 八、运行到手机 App 基座

> 这一节说明「H5 预览正常，但运行到手机 App 基座就异常」的常见情况。
> App 基座是手机上的原生运行环境，不经过 Vite 的 `/api` 代理，
> `127.0.0.1` 也指向手机自己，所以网络地址必须显式配置。

### 1. 现象与原因对照

| 现象 | 大致原因 | 处理 |
| --- | --- | --- |
| 登录、首页等所有接口超时或 Network Error | App 端没有 Vite 代理；`BASE_URL` 为空时 `/api/...` 没有可用的后端来源；后端默认只监听 `127.0.0.1` | 后端用 `--host 0.0.0.0` 启动；配置 `VITE_API_BASE=http://电脑局域网IP:8000`；手机和电脑连同一个 Wi-Fi |
| 接口能通，但凭证、静态图、PDF 打不开 | 后端返回 `/uploads`、`/static` 相对地址，App 端要靠 `assetUrl()` 拼 `BASE_URL`；地址仍写成 `127.0.0.1` 时指向手机自己 | 把 `VITE_API_BASE` 改成电脑局域网 IP 或线上域名，重新运行基座 |
| Android 9+ 上 HTTP 请求可能被系统拦截 | 系统对明文 HTTP 的限制取决于 targetSdk 和打包配置，默认可能不允许 cleartext | 优先使用 HTTPS；演示环境需要在打包配置中允许明文流量，或使用允许 cleartext 的测试基座 |
| 基座提示模块、证书或版本不匹配，甚至白屏 | `manifest.json` 的 `appid` 为空；声明了 Push / Payment / FaceID 模块但没有证书；编译器 alpha 版本与基座版本不一致 | 填入 DCloud appid；移除未使用的模块或补齐证书；使用与当前 HBuilderX / 编译器匹配的基座 |
| 推送、支付、生物识别调用失败 | 当前是演示实现：通知只写数据库，支付走 mock 接口，面容解锁调用 `/api/auth/face`，没有接真实的 uni-push / uni-pay / FaceID SDK | 演示时不要期待原生能力；真实接入需要 appid、证书、商户号和服务端回调 |
| 手机上一直白屏、加载中，或页面能开但没数据 | 后端没有监听 `0.0.0.0`；手机与电脑不在同一网段；Windows 防火墙、VPN、访客网络隔离了 8000 端口 | 关闭 VPN，确认同一局域网，放行 8000，先用手机浏览器访问 `http://电脑IP:8000/api/health` 验证 |

### 2. App 基座最小可用配置

1. 电脑上的后端监听所有网卡：

```powershell
cd D:\workZone\APP\backend
python main.py --host 0.0.0.0 --port 8000 --no-browser
```

也可以在启动前设置 `JIADENG_HOST=0.0.0.0`，再使用一键启动。

2. 查看电脑局域网 IP，例如 `192.168.1.23`：

```powershell
ipconfig
```

3. 在 `frontend` 下新建 `.env.local`（本机配置，不要提交）：

```text
VITE_API_BASE=http://192.168.1.23:8000
```

4. 在 HBuilderX 中选择「运行 → 运行到手机或模拟器 → 运行到 Android App 基座」。
   首次运行前确认 `manifest.json` 已填入 DCloud appid。

> 当前仓库的 `frontend/src/manifest.json` 中 `appid` 为空，这是演示工程。
> 运行到真机基座前，请在 HBuilderX 的 manifest 配置里重新获取/填写 DCloud appid。

5. 重新运行到手机 App 基座。`VITE_API_BASE` 是构建期变量，改完必须重新编译/运行，
   只改文件不重新运行不会生效。

6. 先用手机浏览器打开 `http://192.168.1.23:8000/api/health`：
   能返回 `{"code":0,...}` 再运行 App；如果打不开，先排查防火墙、同一 Wi-Fi 和 IP 是否正确。

> 切回 H5 开发预览时，如果继续使用这个 `.env.local`，也请让后端监听 `0.0.0.0`，
> 或者临时移除该文件恢复同源代理。H5 生产构建前不要把电脑局域网 IP 带进构建产物。

### 3. 为什么 H5 正常、App 异常

- H5 预览的页面和 Python 后端在同一台电脑上，`/api` 由 `vite.config.js` 代理到
  `127.0.0.1:8000`，所以登录正常。
- App 基座运行在手机上，页面由手机本地资源加载，不存在 Vite 代理；
  `127.0.0.1` 在手机上表示手机自己，相对路径 `/api` 也没有后端来源。
- 因此 App 必须通过 `VITE_API_BASE` 指向电脑的局域网 IP（或线上域名），
  同时后端要监听 `0.0.0.0`，手机才能访问。
- `vite.config.js` 的自动启动后端只对开发服务器有效，它在电脑上启动后端，
  但不会改变手机访问的地址。

### 4. 当前演示实现的边界

- **面容解锁**：调用 `/api/auth/face` 演示接口，不是手机原生 Face ID，真机不会弹出系统面容验证。
- **支付**：会员页走 mock 下单 / 支付回调接口，没有接真实 uni-pay。
- **推送**：提醒只写入 `notification_logs`，没有接 uni-push 证书，真机不会收到系统推送。
- **定位轨迹、在线问诊、用药建议**：按设计边界明确不做。

---

## 九、常见问题

**Q：双击 `一键启动.bat` 闪退或停在窗口里？**
A：启动失败时窗口会停住并显示原因，不会再一闪而过。也可以在 PowerShell 里执行：

```powershell
powershell -ExecutionPolicy Bypass -File start.ps1 -CheckOnly
```

它会逐项检查 Python、依赖、前端构建产物和端口。最常见原因是 Python 未加入 PATH、
首次安装依赖时网络超时（脚本会自动切换镜像重试），或 8000 被其他程序占用。

**Q：8000 端口被占用怎么办？**
A：默认的一键启动会自动改用 8001–8010 中第一个空闲端口，并在窗口和浏览器里显示实际地址；
如果显式指定了 `-Port 8000`，则会直接提示端口被占用，不会悄悄换端口。
`停止服务.bat` 会检查 8000–8010，只停止家灯自己的 Python 进程。

**Q：页面能打开但数据是旧的？**
A：先确认后端进程已经重启（本次联调改了接口行为）；再点一次「刷新」，
或在 `backend` 目录执行 `python tools/reset_demo.py` 重置演示数据。

**Q：改了前端源码，打开 8000 却没有变化？**
A：Python 托管的是 `frontend/dist/build/h5` 构建产物，源码改动需要重新构建：

```bash
cd frontend
npm install
npm run build:h5
```

如果本机没有 Node.js，`一键启动.bat` 会继续使用旧的 `dist`，看起来就像「改了没生效」。

**Q：HBuilderX 提示「项目中未找到 node_modules」怎么办？**
A：这说明 HBuilderX 打开的是 CLI 工程，但依赖还没安装。不需要执行它建议的
`npm install -g @vue/cli`（这是 Vue2 脚手架，与本项目无关），正确做法是：

```powershell
cd D:\workZone\APP\frontend
npm install
```

注意要打开 **`D:\workZone\APP\frontend`** 作为 HBuilderX 项目，而不是外层 `APP` 目录。
如果终端提示 `node`/`npm` 不是内部命令，说明 Node.js 已安装但当前进程还没刷新 PATH，
重启 HBuilderX（或重新打开终端）即可；Node.js 默认安装在 `C:\Program Files\nodejs`。
安装依赖后重新运行项目，HBuilderX 就不会再报这个错误。

**Q：HBuilderX 预览时登录请求失败（500）？**
A：HBuilderX/Vite 预览会把 `/api` 代理到 `http://127.0.0.1:8000`。后端没启动时，
代理拿不到响应就会返回 500——这不是登录接口本身的问题。

现在 `frontend/vite.config.js` 会在预览启动时自动检查并拉起后端，正常情况下终端会出现：

```text
[家灯] 正在启动后端：http://127.0.0.1:8000
[家灯] 后端已就绪：http://127.0.0.1:8000
```

如果仍然失败，按下面顺序排查：

1. 看预览终端有没有 Python 报错；缺少依赖时执行
   `python -m pip install -r backend\requirements.txt`。
2. 8000 被其他程序占用时，关闭占用程序，或设置 `JIADENG_PORT` 换端口后重新预览。
3. 修改过 `vite.config.js` 后需要停止并重新运行预览，配置才会生效。
4. 不想让预览自动启动后端时设置 `JIADENG_SKIP_BACKEND=1`，改为手动运行
   `python backend/main.py`。

即使后端异常退出，代理现在也会返回 `{"code":502,"msg":"后端服务未启动或已退出..."}`，
前端会直接显示这条中文提示，而不是一个没有说明的 500。

**Q：App / 小程序里凭证图片、占位图打不开？**
A：原生端与后端不同源，也没有 Vite 代理。请在 `frontend/.env` 配置
`VITE_API_BASE=https://你的后端域名`（或电脑局域网 IP），让接口、`/uploads`、`/static`
都走同一个后端地址。完整排查见「八、运行到手机 App 基座」。

**Q：为什么接口报错变成 422，而且提示是中文？**
A：这是本次联调的统一约定：字段校验失败也返回 `{code, msg, data}`，
`msg` 会说明具体字段，例如「参数有误：任务标题不能为空」。前端直接展示 `msg` 即可。

**Q：想换端口？**
A：一键启动执行 `一键启动.bat -Port 8080`；手动启动用
`python backend/main.py --port 8080`，或设置环境变量 `JIADENG_PORT`。
开发模式下 Vite 代理会跟随 `JIADENG_PORT`，不需要改 `vite.config.js`。
