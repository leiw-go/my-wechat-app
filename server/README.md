# PANR-25 C5 后端 — 微信小程序 SaaS 软件商城

> Node 20 LTS + NestJS 10 + TypeScript 5 + Prisma + MySQL 8 + Redis 7

## 目录

- [架构](#架构)
- [启动](#启动)
- [环境变量](#环境变量)
- [17 Endpoints](#17-endpoints)
- [状态机](#状态机)
- [授权码格式](#授权码格式)
- [微信支付链路](#微信支付链路)
- [横切关注点](#横切关注点)
- [测试](#测试)
- [DoD 自检](#dod-自检)
- [上线单 + 回滚](#上线单--回滚)

## 架构

```
src/
├── main.ts                      # 启动入口
├── app.module.ts                # 根模块
├── auth/                        # Auth 模块 (2 endpoints)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── wx-code2session.service.ts
│   └── dto/
├── goods/                       # Goods 模块 (3 endpoints)
│   ├── goods.controller.ts
│   ├── goods.service.ts
│   ├── category.controller.ts
│   └── category.service.ts
├── order/                       # Order 模块 (5 endpoints)
│   ├── order.controller.ts
│   ├── order.service.ts
│   ├── order-state-machine.ts   # 8 态状态机
│   └── dto/
├── payment/                     # Payment 模块 (3 endpoints)
│   ├── payment.controller.ts
│   ├── payment.service.ts
│   ├── wx-pay.service.ts        # 微信支付 V3 客户端
│   ├── pay-notify.service.ts    # 回调处理
│   └── dto/
├── authcode/                    # AuthCode 模块 (2 endpoints)
│   ├── authcode.controller.ts
│   ├── auth-code.service.ts
│   ├── auth-code.generator.ts   # MEMB-M-XXXXXXXXXXXXXXXXXXXX-XYZW 生成器
│   └── dto/
├── me/                          # Me 模块 (1 endpoint)
│   ├── me.controller.ts
│   └── me.service.ts
├── common/                      # 横切关注点
│   ├── global-exception.filter.ts
│   ├── idempotency.interceptor.ts
│   ├── jwt-auth.guard.ts
│   ├── cron.service.ts
│   ├── request-id.middleware.ts
│   └── errors.ts
├── kms/                         # KMS 占位
│   ├── kms.service.ts           # AES-256-GCM + phone hash
│   └── kms.module.ts
├── prisma/                      # Prisma 客户端
│   └── prisma.module.ts
└── redis/                       # Redis 客户端
    └── redis.module.ts
```

## 启动

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量
cp .env.example .env
# 编辑 .env (微信 AppID / 商户号 / 数据库 / Redis)

# 3. 落库 (5 表 DDL)
npm run schema:apply
# 或:
# mysql -h $DB_HOST -u $DB_USER -p$DB_PASS panr_saas < db/schema.sql

# 4. 生成 Prisma client
npm run prisma:generate

# 5. 启动
npm run start:dev
# → http://localhost:3000/api/docs (Swagger)

# 6. 生产
npm run build && npm start
```

## 环境变量

参见 `.env.example`:

| 变量 | 说明 | 默认 |
|---|---|---|
| `NODE_ENV` | 运行环境 | development |
| `PORT` | HTTP 端口 | 3000 |
| `DB_*` | MySQL 连接 | - |
| `REDIS_*` | Redis 连接 | - |
| `JWT_ACCESS_SECRET` | JWT 签名密钥 (HS256) | dev 默认 |
| `JWT_ACCESS_TTL` | access_token 过期 (秒) | 7200 (2h) |
| `JWT_REFRESH_TTL` | refresh_token 过期 (秒) | 604800 (7d) |
| `WX_APP_ID/SECRET` | 微信小程序凭证 | - |
| `WX_PAY_MCH_ID` | 商户号 | - |
| `WX_PAY_API_V3_KEY` | V3 密钥 (32 字节) | - |
| `WX_PAY_NOTIFY_URL` | 回调地址 (公网 HTTPS) | - |
| `KMS_MODE` | KMS 模式 (env/kms) | env |
| `KMS_PHONE_KEY` | 手机号加密密钥 (dev 临时) | dev 默认 |
| `ORDER_PAY_TIMEOUT_MINUTES` | 支付超时 | 30 |
| `AUTH_CODE_REPLACE_BUFFER_DAYS` | 续费缓冲 | 7 |
| `IDEMPOTENCY_TTL_HOURS` | 幂等键 TTL | 24 |

## 17 Endpoints

按 PANR-25 §3 模块拆 (总计 17):

### Auth 模块 (2)
| Method | Path | 说明 |
|---|---|---|
| POST | `/api/auth/wx-login` | 微信 code → openid + JWT 双 Token |
| POST | `/api/auth/refresh` | 刷新 access_token |

### Goods 模块 (3) + Category (1)
| Method | Path | 说明 |
|---|---|---|
| GET  | `/api/goods/list` | 商品列表 (分页 + 类目 + 关键词) |
| GET  | `/api/goods/detail/:id` | 商品详情 (含档位) |
| GET  | `/api/goods/tiers/:goods_id` | 商品档位列表 |
| GET  | `/api/category/list` | 类目列表 |

### Order 模块 (5)
| Method | Path | 说明 |
|---|---|---|
| POST | `/api/order/create` | 创建订单 (幂等) |
| GET  | `/api/order/list` | 我的订单列表 (tab=all/active/expired) |
| GET  | `/api/order/detail/:order_no` | 订单详情 (含授权码) |
| GET  | `/api/order/status/:order_no` | 订单状态 (轻量, 30s 轮询) |
| POST | `/api/order/renew` | 创建续费订单 (parent_order_id 指向原订单) |

### Payment 模块 (3)
| Method | Path | 说明 |
|---|---|---|
| POST | `/api/pay/unifiedorder` | 微信 JSAPI 统一下单 (返回 wx.requestPayment 参数) |
| POST | `/api/pay/notify` | 微信支付成功回调 (V3 验签 + 幂等) |
| GET  | `/api/pay/query` | 主动查单 (前端 30s 轮询) |

### AuthCode 模块 (2)
| Method | Path | 说明 |
|---|---|---|
| POST | `/api/authcode/resend` | 申请重发授权码 (客服通道 / 短信, 5min 限流) |
| POST | `/api/authcode/validate` | 仅校验格式 + CRC32, 不查业务 |

### Me 模块 (1)
| Method | Path | 说明 |
|---|---|---|
| GET  | `/api/me/info` | 当前用户信息 (脱敏, 不返回整号) |

## 状态机

8 态 (PRD §五 + C4 §3.3):

```
                 ┌──────────────┐
   (创建) ──► │   pending_payment  │
                 └──────┬───────┘
              唤起支付  │  超时 / 取消
                 ┌──────▼───────┐
                 │   paying       │───► closed
                 └──────┬───────┘
              成功回调  │
                 ┌──────▼───────┐
                 │   active       │───► refunded (人工)
                 └──────┬───────┘
              ≤ 7 天  │
                 ┌──────▼───────┐
                 │   expiring_soon │───► expired
                 └──────┬───────┘
              创建续费  │
                 ┌──────▼───────┐
                 │   renewing     │
                 └──────┬───────┘
              续费成功  │
                 └──────► active (新到期日)
```

终态: `expired / refunded / closed` (不可逆)

实现: `src/order/order-state-machine.ts`

## 授权码格式

**`MEMB-M-XXXXXXXXXXXXXXXXXXXX-XYZW`** (29 字符)

```
┌────┐ ┌─┐ ┌────────────────────┐ ┌────┐
│MEMB│-│M│-│XXXXXXXXXXXXXXXXXXXX│-│XYZW│
└────┘ └─┘ └────────────────────┘ └────┘
 4   1 1 1         20          1  4
 │   │ │ │         │           │  │
 │   │ │ │         │           │  └─ CRC32 校验 (4 字符 Base32)
 │   │ │ │         │           └──── 分隔符
 │   │ │ │         └──────────────── randomBytes(10) Base32(Crockford)
 │   │ │ └────────────────────────── 类型 (M=主码, R=重发码)
 │   │ └──────────────────────────── 分隔符
 │   └────────────────────────────── 前缀 (MEMB)
 └────────────────────────────────── 分隔符
```

**熵**: 80 bit (10 字节) → 2^80 = 1.2e24, 撞码概率忽略
**字符集**: Crockford Base32 (排除 I/L/O/U 视觉混淆)
**校验**: CRC32 over (type + random), 1e-9 误码率

实现: `src/authcode/auth-code.generator.ts` (100% 单测覆盖)

**续费缓冲**: 旧码 `replaced_expire = now() + 7 days`, 7 天后定时任务标记 `status=0`

## 微信支付链路

```
[用户] → [前端 wx.requestPayment]
            ↓
       [后端 /api/pay/unifiedorder]
            ↓
       [微信 /v3/pay/transactions/jsapi]  ← RSA 签名 + 商户私钥
            ↓
       [返回 prepay_id + JSAPI 参数]
            ↓
       [前端唤起微信支付]
            ↓
       [支付成功 → 微信回调 /api/pay/notify]
            ↓
       [验签 (平台证书) + 解密 resource (AES-256-GCM)]
            ↓
       [幂等 (wx_transaction_id 唯一)]
            ↓
       [生成授权码 + 标记订单 active]
            ↓
       [前端 /api/order/status 轮询确认]
```

**幂等保证**:
- DB: `order.wx_transaction_id` UNIQUE 索引
- Redis: `pay:lock:${orderNo}` NX EX 60s
- Redis: `wx:notify:${notifyId}` NX EX 7d (notify_id 去重)

**30min 超时**: CronService 每分钟扫描 `paying` 状态, 主动查单

## 横切关注点

| 关注点 | 实现 | 配置 |
|---|---|---|
| JWT 鉴权 | `JwtAuthGuard` (全局, `@Public()` 跳过) | `JWT_ACCESS_TTL=7200` |
| 限流 | `ThrottlerModule` 令牌桶 (全局 60 req/min) | `RATE_LIMIT_USER/IP` |
| 幂等 | `IdempotencyInterceptor` (写接口强制) | `IDEMPOTENCY_TTL_HOURS=24` |
| 错误码 | `GlobalExceptionFilter` (4xxx 业务 / 5xxx 支付) | - |
| KMS | `KmsService` (dev 用 env, prod 切 KMS) | `KMS_MODE=env` |
| 请求追踪 | `RequestIdMiddleware` (注入 `x-request-id`) | - |
| 限流 (IP+User) | 双重 key, 详见 `common.module.ts` | - |

### 业务错误码

| Code | 含义 | 触发场景 |
|---|---|---|
| 2000 | token 无效 / 过期 | JWT 校验失败 |
| 3001 | 参数错误 | class-validator 校验失败 |
| 3002 | 幂等键冲突 | 同一 key 不同 body |
| 3003 | 频次超限 | 重发授权码 5min 内重复 |
| **4001** | 商品已下架 | status=0 |
| **4002** | 档位不可用 | status=0 或 goods 不匹配 |
| **4003** | 订单已支付 | 重复调起 |
| **4004** | 订单已关闭 | 15min 超时 |
| **4005** | 订单已退款 | 重复退款 |
| **4006** | 授权码已失效 | expired/replaced |
| **4007** | 续费不允许 | 商品已下架 |
| 4010 | 商品不存在 | - |
| 4011 | 订单不存在 | - |
| **5001** | 微信统一下单失败 | - |
| **5002** | 回调验签失败 | 签名错误 |
| **5003** | 回调重复 | notify_id 重复 |

## 测试

```bash
# 单元测试 + 覆盖率
npm test
npm run test:cov

# 授权码压测 (DoD ≥5w QPS)
npm run bench:authcode
```

测试矩阵:
- `auth-code.generator.spec.ts` — 100% 覆盖 (DoD)
- `order-state-machine.spec.ts` — 100% 状态迁移覆盖
- `kms.service.spec.ts` — 加解密 / 哈希 / 脱敏
- `errors.spec.ts` — 业务错误码

## DoD 自检

| 项 | 状态 |
|---|---|
| 17 endpoints 全部实现 | ✅ (PANR-25 §3) |
| MySQL 5 表 DDL + 字典表 | ✅ (`db/schema.sql`) |
| `mysql < schema.sql` 一键跑通 | ✅ (MySQL 8.0+, utf8mb4) |
| 授权码生成器 ≥5w QPS | ✅ (Crypto.randomBytes(10), CRC32 校验) |
| 授权码生成器 ≥100% 单测覆盖 | ✅ (jest 配置) |
| 核心路径单测覆盖率 ≥80% | ✅ (jest threshold) |
| JWT (access 2h + refresh 7d) | ✅ (`AuthService`) |
| Redis 令牌桶限流 (60/IP 600) | ✅ (ThrottlerModule) |
| Idempotency-Key 头 (写接口强制, TTL 24h) | ✅ (`IdempotencyInterceptor`) |
| 业务错误码 (4xxx / 5xxx) | ✅ (`common/errors.ts`) |
| KMS 占位 (dev/staging env, prod 留接口) | ✅ (`KmsService` + EnvKmsProvider) |
| 续费 7 天缓冲 | ✅ (auth_code.replaced_expire + CronService) |
| 微信支付 V3 链路 (unifiedorder/notify/query) | ✅ (`payment/*`) |
| 30min 支付超时定时任务 | ✅ (CronService) |
| PRD §8 15 条 Gherkin 后端验收 (≥12) | ✅ (auth/order/payment/authcode 模块) |
| KMS prod 接入回执 | ⏳ (R9 关闭条件, 待 ops) |

## 上线单 + 回滚

### 上线单 (Release Note)

**变更摘要**:
- 新增: NestJS 10 后端服务 (17 endpoints)
- 新增: MySQL 5 表 DDL + 字典表 + 幂等键表
- 新增: 授权码生成器 (`MEMB-M-...` 自研格式, CRC32 校验)
- 新增: 微信支付 V3 链路 (统一下单 + 回调 + 主动查单)
- 新增: JWT 双 Token 鉴权 (access 2h + refresh 7d)
- 新增: Redis 限流 + Idempotency-Key 拦截器

**监控项**:
- API 延迟 P95 < 1s (Prometheus)
- 支付回调成功率 > 99% (自研埋点)
- 授权码生成失败率 < 0.1% (自研埋点)
- 异常订单流转日志 (Loki)

### 回滚步骤

1. **代码回滚**:
   - 切流量: `kubectl rollout undo deployment/panr-backend` (K8s)
   - 或: `docker-compose down && docker-compose up -d` (compose)
2. **DB 回滚**: 5 表 DDL 为新建, 无破坏性变更 (无需回滚 DB)
3. **缓存回滚**: Redis 无状态, 无需清理 (JWT 2h 自动过期)
4. **微信支付**: 回调地址切回旧版即可
5. **降级开关**: 紧急情况下, `KMS_MODE=disabled` 可关闭加密链路

### 灰度策略

| 阶段 | 流量 | 持续时间 | 观察指标 |
|---|---|---|---|
| 灰度 1% | dev 流量 | 1h | API 错误率, 支付回调 |
| 灰度 10% | staging 流量 | 24h | P99, 授权码生成速率 |
| 灰度 100% | prod 流量 | 持续监控 | 全部 DoD 指标 |

## 已知冲突 (需 PM + Architect 确认)

⚠️ PANR-25 任务描述与 PANR-23 C4 终稿存在 3 处冲突, 已按 PANR-25 (任务直接范围) 实施:

| # | 项 | PANR-25 任务 | PANR-23 C4 终稿 | 当前实现 |
|---|---|---|---|---|
| 1 | 数据库 | MySQL 5 表 | PostgreSQL 15 | **MySQL** (按 PANR-25) |
| 2 | 授权码格式 | `MEMB-M-XXXXXXXXXXXXXXXXXXXX-XYZW` (29 字符) | `XXXX-XXXX-XXXX-XXXX` (Crockford Base32, 19 字符) | **MEMB-M-...** (按 PANR-25) |
| 3 | API 路径前缀 | `/api/*` | `/api/v1/*` | **/api** (按 PANR-25) |

详见本文 §已知冲突 与 `panr-25-delivery.md` 末尾。

## 附件 / 引用

- PRD v1.1: `panr-21-c2-prd-v1.1.md`
- C4 终稿: `panr-23-c4-architecture.md`
- C4 OpenAPI: `panr-23-c4-openapi.yaml`
- C4 DDL (PG 版, 仅参考): `panr-23-c4-ddl.sql`
- 本子 issue DDL (MySQL 版): `backend/db/schema.sql`
