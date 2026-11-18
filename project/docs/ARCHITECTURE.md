# 家灯 JiaDeng · 架构说明

## 一、运行架构

```
┌─────────────────────────────────────────────┐
│  uni-app（Vue3 + uview-plus）                │
│  H5 / App / 微信小程序                        │
│  pages(15)  components  api  store           │
└───────────────┬─────────────────────────────┘
                │  HTTPS  /api/*  (Bearer JWT)
┌───────────────▼─────────────────────────────┐
│  FastAPI（backend/main.py）                  │
│  routers → services → SQLAlchemy ORM         │
│  ├ 鉴权：PBKDF2 + HS256 JWT                  │
│  ├ 任务状态机 / 超时扫描 / 重复展开           │
│  ├ 通知降级链路（推送→微信→短信）             │
│  ├ PDF（reportlab，中文字体 + 水印）          │
│  └ 静态托管：H5 构建产物 / 上传文件 / 设计原型 │
└───────────────┬─────────────────────────────┘
                │
        ┌───────▼────────┐        ┌─────────────────┐
        │ SQLite          │        │ 文件系统          │
        │ data/jiadeng.db │        │ data/uploads     │
        │ 19 张表          │        │ data/exports     │
        └────────────────┘        └─────────────────┘
```

**同源部署**：`npm run build:h5` 的产物由 FastAPI 挂载，前端请求 `/api/*` 无需跨域配置；
开发模式下 Vite 把 `/api`、`/static`、`/uploads` 代理到 `127.0.0.1:8000`。

## 二、一次请求的完整链路

以「王丽点击完成」为例：

1. `detail.vue` 调 `POST /api/tasks/1/complete`，带 JWT 与说明/凭证。
2. `deps.current_user` 解 JWT → 查用户；`current_member` 定位家庭与角色。
3. `tasks_service.complete()` 校验责任人 → 写 `attachments` → 状态转 `pending_confirm`
   → 向 `task_events` 追加一条 `complete` 事件 → 给创建人走一遍通知降级链路。
4. 返回统一序列化后的任务；前端刷新详情、流水与首页。

**为什么凭证必须由责任人上传**：主理代传会破坏记录可信度，接口层直接 403。

## 三、任务状态机

```
                 ┌──────────── cancel / skip ────────────┐
                 │                                       ▼
[待认领] --claim--> [已认领] --start--> [进行中] --complete(需确认)--> [待确认] --confirm--> [已完成]
   │                  │                  │                          │
   │                  │                  └--complete(免确认)--------┴──────► [已完成]
   │                  └──── due_at 到期 ────► [已超时] --claim/start/complete--> ...
   └──── question ────► [有疑问] --claim--> ...
```

- 非法流转一律 400，前端按钮依据 `permissions` 渲染，不靠猜。
- `refresh_overdue()` 在读取首页 / 看板 / 详情时惰性执行，避免额外定时任务；
  生产环境可换成 Celery / APScheduler 的分钟级扫描，逻辑不变。
- 重复任务按规则展开独立行（`repeat_rule` 继承），每次可单独 `skip`，互不影响。

## 四、照护流水为什么「只增不改」

`task_events` 没有 UPDATE/DELETE 路由，任何状态变更、提醒、改派、导出都追加新行。
好处：

1. 家庭纠纷时能还原「谁在什么时候做了什么」；
2. 导出 PDF 直接读事件表，天然按时间排序；
3. 长辈的知情权可以落到「谁看了哪一部分」，而不是口头承诺。

## 五、通知降级链路

```
任务事件 → 静默判断（22:00–08:00）
            ├─ 非紧急 → 落库 skipped_quiet（不打扰，不假装送达）
            └─ 紧急且允许穿透 → 继续
         → App 推送（uni-push，需 clientid）
            ├─ 成功 → 停止
            └─ 失败/无 cid → 微信服务通知（需订阅）
                 ├─ 成功 → 停止
                 └─ 失败 → 短信（会员权益）
```

`services/notify.py` 把每一次决策写入 `notification_logs`，包含 `degrade_reason`；
「我的 → 测试提醒链路」会真实走一遍，因此用户可以理解「为什么有时收到短信」。

## 六、离线与同步

- 前端登录后缓存 token、家庭、成员、档案到 `uni.storage`，启动页与首页在无网时仍可展示上次数据。
- 首页顶部常显「已同步 / 离线缓存」，网络恢复监听 `uni.onNetworkStatusChange` 自动刷新。
- 离线打卡（队列补传）属于生产增强项；当前版本在网络恢复后以服务端状态为准。

## 七、报告解读的边界

`services/report_ai.py` 只有两个固定模板（正常 / 3 项异常），按报告名称选择，并加一点固定随机置信度。
接入真实 OCR + 大模型时，只需替换该文件，保持输出结构不变：

```
summary_abnormal  → 哪几项不在参考范围
summary_meaning   → 通常和什么有关（白话）
summary_advice    → 下次看病可以问医生（问题列表）
disclaimer        → 固定免责声明，不可折叠、不可关闭
```

接口层**没有**自由问答入口，从结构上避免医疗表述风险。

## 八、PDF 导出

- `services/pdf.py`：reportlab + 系统微软雅黑，A4，表格 + 概览 + 档案摘要；
- 每页水印「仅用于就医沟通」，页脚页码；
- `hideNames=true` 时把家人姓名替换成「家属A/B」；
- 生成后同时写 `export_records`、`access_logs`（导出）、`task_events`（export），三处留痕。

## 九、权限模型

| 角色 | 能做什么 | 明确不能做 |
| --- | --- | --- |
| owner（主理子女） | 派任务、排班、改派、取消、确认、编辑档案、导出、开通会员 | 代传凭证、删除流水 |
| member（协作子女） | 认领、完成自己的任务、查看被授权档案、看流水 | 排班、改派、编辑档案、导出（无会员权益时） |
| elder（长辈） | 看今天要做什么、一键完成、看自己的用药 | 看排班、看家庭分工、看会员、编辑档案、付费 |

后端在每个写接口都校验角色（`require_owner` / `check_elder_access` / 责任人校验），
前端只负责隐藏入口，不作为安全边界。

## 十、可扩展点

- 定时任务：把 `refresh_overdue` 与复诊任务预生成放进调度器；
- 实时同步：`task_events` 增量 + WebSocket / uni-push 透传；
- 存储：凭证与 PDF 换 OSS / 云存储，数据库换 PostgreSQL；
- 支付：把 `pay_orders` 接到 uni-pay，保留回调验签与幂等即可；
- 多家庭组：`families` 已支持 3 组，前端加家庭切换即可。
