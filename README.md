# 微信小程序商城 (PANR-19)

> 售卖小程序软件的微信小程序商城 — C5 working tree

## 当前迭代范围

本迭代 **支付功能砍掉**，仅验证主流程在测试环境能否起来。

### 主流程可访问页面

| 页面 | 状态 | 接口 |
|---|---|---|
| P1 首页 | ✅ 全功能 | `GET /api/goods/list` + `GET /api/category/list` |
| P2 搜索 | ✅ 全功能 | `GET /api/goods/search` |
| P3 商品详情 | ✅ 全功能 | `GET /api/goods/detail/:id` |
| P4 唤起支付 | ⚠️ 占位 | "支付功能本迭代未启用" |
| P5 支付结果 | ⚠️ 占位 | 同上 |
| P6 我的订单 | ⚠️ 空态 | 无真实订单数据 |
| P7 订单详情 | ⚠️ 空态 | 同上 |
| P8 授权码详情 | ❌ 隐藏入口 | 无授权码数据 |
| P9 个人中心 | ✅ 全功能 | `GET /api/me/info` |
| P10 客服 | ✅ 全功能 | 微信原生 |
| P11/P12 | ⚠️ 占位 | "支付功能本迭代未启用" |

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
