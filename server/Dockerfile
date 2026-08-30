# Multi-stage Dockerfile for PANR-25 backend

FROM node:20-alpine AS builder
WORKDIR /app

# 1. 装依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# 2. 生成 Prisma client
RUN npx prisma generate

# 3. 构建
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ===== Production stage =====
FROM node:20-alpine AS production
WORKDIR /app

# 仅装 prod 依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/me/info || exit 1

ENV NODE_ENV=production
EXPOSE 3000

# 直接启动编译产物 (省内存)
CMD ["node", "dist/main.js"]
