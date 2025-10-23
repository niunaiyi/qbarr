# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY src ./src
COPY public ./public

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 安装Docker CLI
RUN apk add --no-cache docker-cli

# 复制依赖文件
COPY package*.json ./

# 只安装生产依赖
RUN npm install --only=production

# 从构建阶段复制编译后的文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# 暴露端口
EXPOSE 8011

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8011/api/docker/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "dist/main"]

