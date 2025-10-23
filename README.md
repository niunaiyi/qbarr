# *arr 容器控制器

🐳 根据qbittorren已下载文件大小,控制 *arr启动或停止,从而减少磁盘活动,达到保护磁盘的目的.

当qbittorrent下载完成的文件大小超过指定大小,刚启动*arr,把文件从qbittorrent移动到指定的目录.

当qbittorrent下载完成的文件大小低于指定大小,刚停止*arr,让qbittorrent继续下载.

## ✨ 功能特性

- 🎯 **Web 界面管理** - 通过现代化的 Web 界面直观地管理 Docker 容器
- 🚀 **容器控制** - 启动、停止、重启、暂停、恢复容器
- 📊 **实时统计** - 查看容器和镜像的实时统计信息
- 🔄 **自动刷新** - 每 30 秒自动刷新容器状态
- 🎨 **美观界面** - 响应式设计，支持移动端访问
- ⚡ **快速响应** - 基于 NestJS 框架，性能优异
- 🔐 **选择性监控** - 可配置只监控指定的容器（默认监控所有 *arr 系列容器）
- 📊 **自动启停** - 根据文件夹大小自动启停容器（可选功能）

## 🛠️ 技术栈

- **后端框架**: NestJS (TypeScript)
- **Docker SDK**: dockerode
- **前端**: 原生 HTML/CSS/JavaScript
- **容器化**: Docker & Docker Compose

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 快速开始

> 💡 **推荐部署方式**:
> - 🎯 **最简单**: [镜像方式部署](QUICK-DEPLOY.md) - 无需源代码，直接运行
> - 🪟 **Windows 用户**: [Windows 构建指南](WINDOWS-BUILD.md) - Windows 专用教程
> - 📚 **完整指南**: [Linux 部署指南](DEPLOY.md) - 详细的部署文档

### 使用 Docker Compose（推荐）

1. **克隆项目**
```bash
cd rswd
```

2. **启动服务**
```bash
docker-compose up -d
```

3. **访问 Web 界面**
```
打开浏览器访问: http://localhost:8011
```

4. **查看日志**
```bash
docker-compose logs -f
```

5. **停止服务**
```bash
docker-compose down
```

### 使用 Docker 命令

1. **构建镜像**
```bash
docker build -t qbarr .
```

2. **运行容器**
```bash
docker run -d \
  --name qbarr \
  -p 8011:8011 \
  -e PORT=8011 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  qbarr
```

3. **访问应用**
```
http://localhost:8011
```

## 🔧 本地开发

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run start:dev
```

### 构建生产版本

```bash
npm run build
npm run start:prod
```

## 📡 API 端点

### 容器管理

- `GET /api/docker/containers` - 列出所有容器（支持查询参数 `?all=true`）
- `POST /api/docker/containers/:id/start` - 启动容器
- `POST /api/docker/containers/:id/stop` - 停止容器

## 🎯 使用示例

### 启动容器

```bash
curl -X POST http://localhost:8011/api/docker/containers/{container_id}/start
```

### 停止容器

```bash
curl -X POST http://localhost:8011/api/docker/containers/{container_id}/stop \
  -H "Content-Type: application/json" \
  -d '{"timeout": 10}'
```

### 列出所有容器

```bash
curl http://localhost:8011/api/docker/containers?all=true
```

## ⚙️ 配置说明

### 环境变量

- `PORT` - 应用端口（默认: 8011）
- `NODE_ENV` - 运行环境（development/production）
- `MONITORED_CONTAINERS` - 要监控的容器名称列表（默认: arr，监控所有 *arr 系列容器）
- `MONITOR_PATH` - 监控的文件夹路径（容器内路径）
- `EXCLUDE_FOLDER` - 排除计算的文件夹名称（默认: incomplete）
- `START_THRESHOLD_GB` - 启动容器的文件夹大小阈值（GB）
- `STOP_THRESHOLD_GB` - 停止容器的文件夹大小阈值（GB）

### 自定义监控容器

编辑 `docker-compose.yml` 中的环境变量：

```yaml
environment:
  # 监控所有 *arr 系列容器（默认）
  - MONITORED_CONTAINERS=arr
  
  # 或指定具体的容器
  # - MONITORED_CONTAINERS=radarr,sonarr,lidarr,prowlarr
```

或使用 Docker 命令：

```bash
# 监控所有 *arr 系列容器
docker run -d \
  -e MONITORED_CONTAINERS=arr \
  ...

# 或指定具体容器
docker run -d \
  -e MONITORED_CONTAINERS=radarr,sonarr,lidarr \
  ...
```

**说明**:
- 默认配置 `arr` 会监控所有 *arr 系列容器（radarr, sonarr, lidarr, readarr, prowlarr, whisparr 等）
- 支持逗号分隔多个容器名
- 不区分大小写
- 支持部分匹配（如 "radarr" 会匹配 "radarr-1", "my-radarr" 等）
- 详细配置请查看: [CONFIG.md](CONFIG.md)

### 文件夹监控与自动启停

系统可以监控指定目录的大小，并根据阈值自动启停容器：

```yaml
environment:
  - MONITOR_ENABLED=true              # 启用监控
  - MONITOR_PATH=/downloads           # 监控路径
  - EXCLUDE_FOLDER=incomplete         # 排除的文件夹
  - START_THRESHOLD_GB=100            # 启动阈值（GB）
  - STOP_THRESHOLD_GB=50              # 停止阈值（GB）
```

**工作原理**:
- 当文件夹大小 ≥ 100GB → 自动启动所有 *arr 容器
- 当文件夹大小 ≤ 50GB → 自动停止所有 *arr 容器
- 文件夹大小在 50-100GB 之间 → 保持当前状态

**详细说明**: [MONITOR.md](MONITOR.md)

### Docker Socket

应用通过挂载 Docker socket 来控制宿主机的 Docker：

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**⚠️ 安全提示**: 挂载 Docker socket 会给予容器完全的 Docker 控制权限，请仅在受信任的环境中使用。

## 🔒 安全建议

1. **网络隔离** - 在生产环境中使用反向代理（如 Nginx）
2. **访问控制** - 添加身份验证机制
3. **HTTPS** - 启用 HTTPS 加密通信
4. **防火墙** - 限制端口访问范围
5. **最小权限** - 只挂载必要的 Docker socket

## 📸 界面预览

Web 界面提供以下功能：

- 📊 实时显示容器统计信息（总数、运行中、暂停、停止）
- 📦 容器列表展示，包含名称、ID、镜像、状态
- 🎮 一键操作按钮（启动、停止、重启、暂停、删除）
- 🔄 自动刷新和手动刷新功能
- 📱 响应式设计，支持手机和平板访问

## 🐛 故障排除

### 无法连接到 Docker

**问题**: 应用无法连接到 Docker 守护进程

**解决方案**:
1. 确认 Docker 服务正在运行
2. 检查 Docker socket 路径是否正确挂载
3. 查看容器日志: `docker-compose logs qbarr`

### 权限问题

**问题**: 权限被拒绝

**解决方案**:
```bash
# 确保 Docker socket 有正确的权限
sudo chmod 666 /var/run/docker.sock
```

## 📝 项目结构

```
.
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 主模块
│   └── docker/
│       ├── docker.module.ts    # Docker 模块
│       ├── docker.controller.ts # Docker 控制器
│       └── docker.service.ts   # Docker 服务
├── public/
│   └── index.html              # Web 界面
├── Dockerfile                  # Docker 镜像定义
├── docker-compose.yml          # Docker Compose 配置
├── package.json                # 项目依赖
├── tsconfig.json              # TypeScript 配置
└── README.md                  # 项目文档
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [NestJS 文档](https://docs.nestjs.com/)
- [dockerode 文档](https://github.com/apocas/dockerode)
- [Docker API 文档](https://docs.docker.com/engine/api/)

## 💡 提示

- 默认每 30 秒自动刷新容器状态
- 删除容器前会有确认提示
- 支持查看所有容器（包括已停止的）
- 容器按状态显示不同颜色标识

---

**注意**: 此工具提供了对宿主机 Docker 的完全控制权限，请在安全的环境中使用，并做好访问控制。



