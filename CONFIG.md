# ⚙️ 配置说明

Docker 容器控制器的配置指南。

## 📋 环境变量

### PORT
- **类型**: 数字
- **默认值**: 8011
- **说明**: 应用运行的端口号

```bash
PORT=8011
```

### NODE_ENV
- **类型**: 字符串
- **默认值**: production
- **可选值**: development, production
- **说明**: Node.js 运行环境

```bash
NODE_ENV=production
```

### MONITORED_CONTAINERS
- **类型**: 字符串（逗号分隔）
- **默认值**: arr
- **说明**: 要监控和管理的容器名称列表
- **特点**: 
  - 不区分大小写
  - 支持部分匹配
  - 逗号分隔多个容器名

```bash
# 默认配置（监控所有 *arr 系列容器）
MONITORED_CONTAINERS=arr
# 这会匹配: radarr, sonarr, lidarr, readarr, prowlarr, whisparr 等

# 指定具体容器
MONITORED_CONTAINERS=radarr,sonarr,lidarr

# 其他示例
MONITORED_CONTAINERS=nginx,mysql,redis
MONITORED_CONTAINERS=web-server,api-server,worker
```

---

## 🔧 配置方式

### 方式 1: 使用 docker-compose.yml（推荐）

编辑 `docker-compose.yml` 文件：

```yaml
services:
  qbarr:
    environment:
      - PORT=8011
      - NODE_ENV=production
      - MONITORED_CONTAINERS=radarr,sonarr,whisparr
```

### 方式 2: 使用 .env 文件

创建 `.env` 文件（可参考 `.env.example`）：

```bash
PORT=8011
NODE_ENV=production
MONITORED_CONTAINERS=radarr,sonarr,whisparr
```

然后在 docker-compose.yml 中引用：

```yaml
services:
  qbarr:
    env_file:
      - .env
```

### 方式 3: Docker 命令行

```bash
docker run -d \
  --name qbarr \
  -p 8011:8011 \
  -e PORT=8011 \
  -e MONITORED_CONTAINERS=radarr,sonarr,whisparr \
  -v /var/run/docker.sock:/var/run/docker.sock \
  qbarr:latest
```

---

## 📝 监控容器配置详解

### 容器名称匹配规则

`MONITORED_CONTAINERS` 使用**部分匹配**，这意味着：

#### 示例 1: 监控所有 *arr 系列容器（推荐）
```bash
MONITORED_CONTAINERS=arr
```
匹配的容器：
- ✅ `radarr`
- ✅ `sonarr`
- ✅ `lidarr`
- ✅ `readarr`
- ✅ `prowlarr`
- ✅ `whisparr`
- ✅ `bazarr`
- ✅ `myarr` (任何包含 arr 的容器)
- ❌ `plex`
- ❌ `nginx`

#### 示例 2: 指定具体容器
```bash
MONITORED_CONTAINERS=radarr,sonarr,lidarr
```
匹配的容器：
- ✅ `radarr`
- ✅ `sonarr`
- ✅ `lidarr`
- ✅ `radarr-1` (部分匹配)
- ✅ `my-sonarr` (部分匹配)
- ❌ `prowlarr`

#### 示例 3: 部分匹配
```bash
MONITORED_CONTAINERS=radarr
```
匹配的容器：
- ✅ `radarr`
- ✅ `radarr-1`
- ✅ `my-radarr`
- ✅ `radarr-test`
- ✅ `radarr_container`

#### 示例 4: 多容器配置
```bash
MONITORED_CONTAINERS=web,api,worker,db
```
匹配的容器：
- ✅ `web-server`
- ✅ `api-gateway`
- ✅ `worker-1`
- ✅ `postgres-db`

### 不区分大小写

```bash
MONITORED_CONTAINERS=Radarr,SONARR,WhiSpaRr
# 等同于
MONITORED_CONTAINERS=radarr,sonarr,whisparr
```

都会匹配：
- ✅ `radarr`, `Radarr`, `RADARR`
- ✅ `sonarr`, `Sonarr`, `SONARR`
- ✅ `whisparr`, `Whisparr`, `WHISPARR`

---

## 🎯 常见配置场景

### 场景 1: 媒体服务器管理（默认）

```bash
# 方式 1: 监控所有 *arr 系列（推荐，最简单）
MONITORED_CONTAINERS=arr

# 方式 2: 指定具体容器
MONITORED_CONTAINERS=radarr,sonarr,lidarr,prowlarr,whisparr,readarr

# 方式 3: 监控 arr 系列 + 其他媒体服务
MONITORED_CONTAINERS=arr,plex,jellyfin,overseerr
```

### 场景 2: Web 应用栈

```bash
MONITORED_CONTAINERS=nginx,nodejs,redis,postgres
```

### 场景 3: 开发环境

```bash
MONITORED_CONTAINERS=dev-frontend,dev-backend,dev-db,dev-redis
```

### 场景 4: 监控所有包含特定关键词的容器

```bash
# 监控所有 *arr 系列应用（默认配置）
MONITORED_CONTAINERS=arr
# 匹配: radarr, sonarr, lidarr, readarr, prowlarr, whisparr, bazarr 等

# 监控所有名称包含 "prod" 的容器
MONITORED_CONTAINERS=prod

# 监控所有包含 "media" 的容器
MONITORED_CONTAINERS=media
```

### 场景 5: 单个容器

```bash
MONITORED_CONTAINERS=nginx
```

---

## 🔄 修改配置后重启

### 使用 docker-compose

```bash
# 方式 1: 重启服务
docker-compose restart

# 方式 2: 重新创建容器
docker-compose up -d --force-recreate

# 方式 3: 停止并重新启动
docker-compose down
docker-compose up -d
```

### 使用 docker 命令

```bash
# 1. 停止并删除旧容器
docker stop qbarr
docker rm qbarr

# 2. 用新配置启动
docker run -d \
  --name qbarr \
  -p 8011:8011 \
  -e MONITORED_CONTAINERS=新的容器列表 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  qbarr:latest
```

---

## 📊 验证配置

### 查看日志确认监控的容器

```bash
# docker-compose
docker-compose logs qbarr | grep "监控的容器"

# docker
docker logs qbarr | grep "监控的容器"
```

输出示例：
```
[DockerService] 监控的容器列表: radarr, sonarr, whisparr
[DockerService] 找到 3 个监控的容器
```

### 通过 API 检查

```bash
# 列出当前监控的容器
curl http://localhost:8011/api/docker/containers?all=true
```

### 通过 Web 界面查看

访问 `http://localhost:8011`，页面上只会显示配置的容器。

---

## 🔒 安全建议

### 限制容器访问范围

通过配置 `MONITORED_CONTAINERS`，你可以：
- ✅ 只暴露需要管理的容器
- ✅ 隐藏敏感或系统容器
- ✅ 按项目或团队划分管理权限

### 示例：只管理生产容器

```bash
# 只监控生产环境的容器
MONITORED_CONTAINERS=prod-web,prod-api,prod-db
```

这样即使有人访问了控制器，也无法看到或操作其他容器。

---

## 🐛 故障排除

### 问题 1: 看不到任何容器

**原因**: `MONITORED_CONTAINERS` 配置不匹配任何容器名

**解决**:
```bash
# 1. 查看所有容器名称
docker ps -a --format "{{.Names}}"

# 2. 调整 MONITORED_CONTAINERS 配置
# 确保配置的名称与实际容器名称匹配

# 3. 重启服务
docker-compose restart
```

### 问题 2: 某些容器显示，某些不显示

**原因**: 部分容器名称不在监控列表中

**解决**:
```bash
# 将所有需要监控的容器添加到配置中
MONITORED_CONTAINERS=container1,container2,container3
```

### 问题 3: 环境变量不生效

**解决**:
```bash
# 1. 确认环境变量已设置
docker exec qbarr env | grep MONITORED

# 2. 重新创建容器（而不是重启）
docker-compose up -d --force-recreate

# 3. 查看日志确认
docker-compose logs qbarr
```

---

## 💡 高级技巧

### 动态配置

创建脚本动态生成配置：

```bash
#!/bin/bash
# generate-config.sh

# 自动检测所有 *arr 容器
ARR_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -i "arr" | tr '\n' ',')

# 生成配置
echo "MONITORED_CONTAINERS=${ARR_CONTAINERS}" > .env

# 重启服务
docker-compose up -d --force-recreate
```

### 多环境配置

```bash
# .env.dev
MONITORED_CONTAINERS=dev-radarr,dev-sonarr

# .env.prod
MONITORED_CONTAINERS=radarr,sonarr,whisparr

# 使用不同配置启动
docker-compose --env-file .env.prod up -d
```

---

## 📞 需要帮助？

- 项目文档: [README.md](README.md)
- 部署指南: [QUICK-DEPLOY.md](QUICK-DEPLOY.md)
- 查看日志: `docker-compose logs -f qbarr`

---

**总结**: 通过 `MONITORED_CONTAINERS` 环境变量，你可以灵活控制要监控和管理的容器！🎯

