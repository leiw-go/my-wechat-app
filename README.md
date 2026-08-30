# 微信小程序商城 (PANR-19)

> 售卖小程序软件的微信小程序商城 — C5 working tree

## 当前迭代范围

本迭代 **支付功能砍掉**，仅验证主流程在测试环境能否起来。

## 后端 baseURL — Option B'（PM 二次拍板）

外网入口走 nginx 反代，**严禁**再回到直连 `43.143.244.13:3000`（外网 3000 端口云安全组拦截，已确认）。

| 项 | 值 |
|---|---|
| baseURL | `https://yaowen.store/panr-api` |
| nginx 行为 | `/panr-api/*` strip 前缀 → `proxy_pass http://127.0.0.1:3000/` |
| 协议 | HTTPS（接近生产语义） |
| 环境变量 | `VITE_API_BASE_URL`（详见 `.env.example`） |

**WeChat 开发者工具要求**（测试 AppID `wxde0c66d012c15d87` 未走 ICP 业务域名流程）：

- ⚠️ **必须勾选「不校验合法域名」**（开发者工具 → 详情 → 本地设置 → 不校验合法域名...）
- 否则真机预览会因域名未备案被微信拦截

## 本地启动

```bash
cp .env.example .env       # 拷贝环境模板（.env 已被 gitignore 忽略）
# 按需覆盖 VITE_API_BASE_URL / VITE_WX_APPID 等
# 微信开发者工具导入项目后勾选「不校验合法域名」
```

### 主流程可访问页面

| 页面 | 状态 | 接口 |
|---|---|---|
| P1 首页 | ✅ 全功能 | `GET /api/goods/list` + `GET /api/category/list` |
| P2 搜索 | ✅ 全功能 | `GET /api/goods/search` |
| P3 商品详情 | ✅ 全功能 | `GET /api/goods/detail/:id` |
| P4 唤起支付 | ⚠️ 占位 | "支付功能未启用" |
| P5 支付结果 | ⚠️ 占位 | 同上 |
| P6 我的订单 | ⚠️ 空态 | 无真实订单数据 |
| P7 订单详情 | ⚠️ 空态 | 同上 |
| P8 授权码详情 | ❌ 隐藏入口 | 无授权码数据 |
| P9 个人中心 | ✅ 全功能 | `GET /api/me/info` |
| P10 客服 | ✅ 全功能 | 微信原生 |
| P11/P12 | ⚠️ 占位 | "支付功能未启用" |

## 目录结构

```
.
├── src/         # 前端小程序代码（PANR-24，待 frontend owner 落）
├── server/      # 后端 NestJS 代码（PANR-25，待 backend owner 落）
├── docs/        # 文档（deploy_runbook / demo_script / blockers_checklist 等）
└── README.md
```

## 部署

参见 `docs/deploy_runbook.md` (v1.2 待 ops 更新 — 剔除支付步骤，新增测试环境最小启动清单)。

## 风险与状态

| ID | 风险 | 状态 |
|---|---|---|
| R13 / R16 / R18 | 支付相关风险 | 🟢 N/A（支付砍掉，本轮不适用） |
| R9 | KMS 接入 | 🟡 P2（staging env 临时密钥过渡即可） |
| R12 | C5 联调字段不匹配 | 🟢 已对齐 |

## 节奏

- 测试环境最小启动 ETA ≤ 6h（业务方 4 项回执后）
- 9/1 05:15 Stage 3 first draft 巡检
