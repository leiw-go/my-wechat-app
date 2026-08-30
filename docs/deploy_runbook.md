# 微信小程序商城 — 测试环境部署 Runbook

> **版本**：v1.2
> **更新日期**：2026-08-30
> **更新者**：ops agent（9f8d6e97-f9ce-457e-894b-253af531004c）
> **执行人**：ops 执行人（人类，带业务方授权的 SSH key）
> **变更摘要**：v1.1 → v1.2 适配「支付功能本迭代砍掉」+ 业务方提供真实服务器 IP/域名（43.143.244.13 / https://yaowen.store）+ docker-compose 编排

---

## 0. 前置（执行人凭据安全）

| 项 | 值 | 备注 |
|---|---|---|
| **服务器 IP** | `43.143.244.13` | 业务方提供（公网） |
| **域名** | `https://yaowen.store` | 业务方提供（已 HTTPS） |
| **SSH 账号** | `root@43.143.244.13` | 业务方在服务器 `~/.ssh/authorized_keys` 已放 ops 公钥 |
| **SSH 私钥** | **不在本 runbook / 不在 PANR 顶层贴** | 走 1Password / Vault 等独立安全通道 |
| **业务方补齐项** | MySQL 连接串 + 测试 AppID | 未到位 → 仅能完成 §1-§5，smoke test 部分阻塞 |

> ⚠️ **凭据安全提示（与协调方记账一致）**：服务器 IP + 域名已在 PANR-19 顶层公开（半公开频道），但 **SSH 私钥 / root pwd / DB pwd 一律走 1Password / Vault，不再回贴明文**。

---

## 1. SSH 连通性自检（≤ 5 min）

```bash
# 替换 <KEY_PATH> 为 ops 执行人本地的私钥路径（1Password / Vault 拉取）
ssh -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=10 \
    -i <KEY_PATH> \
    root@43.143.244.13 \
    "echo connected; whoami; uname -a; cat /etc/os-release | head -5"
```

**期望输出**：
```
connected
root
Linux ... 5.x.x ...
PRETTY_NAME="..."  # Ubuntu 22.04 / Debian 12 / CentOS 7+ 任一
```

**若 Permission denied (publickey)**：
- 检查 ops 公钥是否已在服务器 `~/.ssh/authorized_keys`
- 业务方需在服务器侧 `echo "<ops 公钥>" >> ~/.ssh/authorized_keys`
- 不要走 https / password fallback

---

## 2. 基础镜像栈拉起（≤ 30 min，docker-compose）

### 2.1 服务器前置依赖

```bash
ssh -i <KEY_PATH> root@43.143.244.13 << 'EOF'
# 安装 Docker（如未装）
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# 安装 docker-compose plugin（如未装）
if ! docker compose version &> /dev/null; then
  apt-get update && apt-get install -y docker-compose-plugin
fi

# 校验
docker --version
docker compose version
EOF
```

### 2.2 落 `docker-compose.yml`（dev/staging 共栈）

服务器 `/opt/panr-stack/docker-compose.yml`：

```yaml
version: "3.9"

services:
  mysql:
    image: mysql:8.0
    container_name: panr-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}    # 走 1Password
      MYSQL_DATABASE: panr
      MYSQL_USER: panr
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}              # 走 1Password
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - /opt/panr-stack/db/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uroot", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: panr-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    image: node:20-alpine
    container_name: panr-backend
    restart: unless-stopped
    working_dir: /app
    command: sh -c "npm ci --omit=dev && npm run build && node dist/main.js"
    environment:
      NODE_ENV: staging
      PORT: 3000
      WECHAT_PAY_MCH_ID: ""           # 留空 → /api/pay/* 直返 5030
      WECHAT_PAY_API_KEY: ""
      WECHAT_PAY_CERT_PATH: ""
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: panr
      DB_PASSWORD: ${MYSQL_PASSWORD}  # 走 1Password
      DB_NAME: panr
      REDIS_HOST: redis
      REDIS_PORT: 6379
      PHONE_AES_KEY: ${PHONE_AES_KEY} # dev/staging env 临时密钥（prod 切 KMS）
      JWT_SECRET: ${JWT_SECRET}       # 走 1Password
    ports:
      - "0.0.0.0:3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - /opt/panr-stack/backend:/app

  nginx:
    image: nginx:alpine
    container_name: panr-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /opt/panr-stack/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /opt/panr-stack/nginx/certs:/etc/nginx/certs:ro
      - /opt/panr-stack/frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend

volumes:
  mysql-data:
```

### 2.3 拉起栈

```bash
ssh -i <KEY_PATH> root@43.143.244.13 << 'EOF'
mkdir -p /opt/panr-stack/{db/init,backend,nginx/certs,frontend/dist}
cd /opt/panr-stack

# 写 .env（凭据走 1Password 注入，本 runbook 不列）
cat > .env << 'ENVEOF'
MYSQL_ROOT_PASSWORD=<FROM_1P>
MYSQL_PASSWORD=<FROM_1P>
PHONE_AES_KEY=<FROM_1P_DEV_TEMP>
JWT_SECRET=<FROM_1P>
ENVEOF
chmod 600 .env

docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=50 backend
EOF
```

---

## 3. 落 `server/` 代码（≤ 10 min）

```bash
ssh -i <KEY_PATH> root@43.143.244.13 << 'EOF'
cd /opt/panr-stack/backend
git clone git@github.com:leiw-go/my-wechat-app.git .
git checkout feat/panr-19-c5-payment-deferred
# 取后端加固 commit（协调方记账 9aeff1b — 与前端 commit 同一分支）
git log --oneline -5
# 期望：f2db13f + 后端 commit 9aeff1b
EOF
```

> **注意**：业务方已提供 SSH key → GitHub 通道在 ops 执行人侧验证（与 §1 同一 key）；若 `git clone` 报 `Permission denied`，是 SSH key 没加到 GitHub deploy keys，联系业务方加。

---

## 4. 起后端 + 初始化数据库（≤ 15 min）

```bash
ssh -i <KEY_PATH> root@43.143.244.13 << 'EOF'
# 等 MySQL healthy 后落 schema
docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD"

# 初始化 5 表 + seed（schema.sql + seed_data.sql 来自 PANR-25 + ops）
docker compose exec -T mysql sh -c '
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" panr < /docker-entrypoint-initdb.d/../../backend/migrations/001_init_schema.sql;
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" panr < /docker-entrypoint-initdb.d/../../backend/db/seed_data.sql;
'

# 验证后端启动 + /api/health
sleep 5
curl -fsS http://127.0.0.1:3000/api/health/live
# 期望：{"status":"ok"}

# 自测 /api/pay/* 应直返 5030（支付功能本迭代未启用）
curl -i -X POST http://127.0.0.1:3000/api/pay/unifiedorder \
  -H 'Content-Type: application/json' \
  -d '{}'
# 期望：HTTP 503 + body 含 "支付功能未启用"
EOF
```

---

## 5. 起前端 + Nginx 代理（≤ 10 min）

```bash
ssh -i <KEY_PATH> root@43.143.244.13 << 'EOF'
cd /opt/panr-stack/frontend
git clone git@github.com:leiw-go/my-wechat-app.git .
git checkout feat/panr-19-c5-payment-deferred
# 取前端 commit（协调方记账 be9ba8f — 占位/拦截/P8 隐藏）
git log --oneline -5
# 期望：f2db13f + 后端 9aeff1b + 前端 be9ba8f

# 安装 + 构建 dev 版（前端 owner 已在 commit 中配好 build:dev 脚本）
npm ci
npm run build:dev
# 产物落 dist/

# 写 Nginx 配置（反代 + 静态）
cat > /opt/panr-stack/nginx/nginx.conf << 'NGINXEOF'
events { worker_connections 1024; }
http {
  server {
    listen 80;
    server_name yaowen.store;
    return 301 https://$host$request_uri;
  }
  server {
    listen 443 ssl;
    server_name yaowen.store;
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    root /usr/share/nginx/html;
    location /api/ {
      proxy_pass http://backend:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
  }
}
NGINXEOF

# 申请证书（业务方已有 → 拷到 /opt/panr-stack/nginx/certs/；
# 无 → 用 Let's Encrypt：docker run --rm certbot/certbot certonly --standalone -d yaowen.store）
docker compose restart nginx
EOF
```

---

## 6. 业务方补 MySQL + AppID 后（不阻塞起服，顺序调整）

```bash
ssh -i <KEY_PATH> root@43.143.244.13 << 'EOF'
# 把业务方提供的 MySQL 连接串 + 测试 AppID 落到 .env（1Password 拉取）
cat >> /opt/panr-stack/.env << 'ENVEOF'
# 业务方回执后追加
WX_APP_ID=<FROM_BIZ>
MYSQL_PUBLIC_HOST=<FROM_BIZ>
ENVEOF

docker compose restart backend
docker compose logs --tail=20 backend | grep -E "(listening|ready|error)"
EOF
```

---

## 7. 端到端 smoke test（≤ 30 min）

### 7.1 API 冒烟（curl）

```bash
# 后端 health
curl -fsS https://yaowen.store/api/health/live
# 期望：{"status":"ok"}

# 商品列表（主流程 P1）
curl -fsS https://yaowen.store/api/goods/list
# 期望：JSON 数组 ≥ 1（seed_data.sql 已注入首期 IP）

# 商品详情（主流程 P3）
curl -fsS https://yaowen.store/api/goods/detail/1
# 期望：JSON 含 title / subtitle / tiers

# 微信支付接口（应直返 5030 — 支付功能未启用）
curl -i -X POST https://yaowen.store/api/pay/unifiedorder \
  -H 'Content-Type: application/json' -d '{}'
# 期望：HTTP 503 + 错误码 5030
```

### 7.2 前端冒烟（curl + wx dev tool）

```bash
# 静态资源
curl -fsSI https://yaowen.store/
# 期望：HTTP 200 + Content-Type: text/html

# 前端 commit be9ba8f 应已落「支付功能本迭代未启用」占位文案
curl -fsS https://yaowen.store/ | grep -c "支付功能本迭代未启用"
# 期望：≥ 1
```

### 7.3 真机扫码（业务方 / 协调方）

- 业务方用微信开发者工具打开 `/opt/panr-stack/frontend` → 点「预览」生成体验码
- 业务方扫码 → 看到 P1 首页 + P2 搜索 + P3 详情 + P9 个人中心 + P10 客服 **全功能**
- P4 / P5 / P6 / P7 / P8 / P11 / P12 看到「支付功能本迭代未启用」占位

---

## 8. 回执（ops 执行人 → PANR-19 顶层评论）

回贴内容：
- 服务器 ready 时间戳
- `curl https://yaowen.store/api/health/live` 输出
- 5 条主路径冒烟截图（或 curl 输出）
- 任何阻塞项（MySQL / AppID / 证书）

---

## 9. 不在本 runbook 范围内

- 不替业务方签发 HTTPS 证书（业务方已有 → 拷入；无 → ops 执行人跑 certbot）
- 不替业务方配 MySQL 账号（业务方开通运维 DB 账号）
- 不替业务方申请测试 AppID（业务方在微信公众平台申请）
- 不写后端 / 前端代码（归 C5 owner）
- 不上线 prod（仅测试环境）

---

## 附录 A. v1.1 → v1.2 变更摘要

| 变更 | v1.1 | v1.2 |
|---|---|---|
| 服务器 IP | `stg-api.example.com` 占位 | `43.143.244.13` 业务方提供 |
| 域名 | 占位 | `https://yaowen.store` 业务方提供 |
| 编排 | 仅 `npm` 启动 | `docker-compose`（mysql + redis + backend + nginx） |
| 支付链路 | R13 / 商户号 v3 强前置 | 剔除（`WECHAT_PAY_*` env 留空 → 5030） |
| HTTPS 证书 | 假设已有 | 占位路径 `/opt/panr-stack/nginx/certs/`，由业务方或 certbot 提供 |
| smoke test | 5 主路径含 P4/P5 | **5 主路径 P1/P2/P3/P9/P10 + 4 占位 P4-P8/P11/P12** |
| 凭据管理 | env 文件 | **走 1Password / Vault**，runbook 仅写变量名 |