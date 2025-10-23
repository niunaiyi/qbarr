# Docker Controller 部署指南

## 方法一：使用导出的镜像文件部署（推荐用于离线环境）

### 1. 构建和导出镜像

在开发机器上执行：

```bash
# 给脚本添加执行权限
chmod +x build-image.sh

# 运行构建脚本
./build-image.sh
```

这将生成 `docker-controller-image.tar` 或 `docker-controller-image.tar.gz` 文件。

### 2. 传输镜像到目标服务器

```bash
# 使用 scp 传输
scp docker-controller-image.tar.gz user@target-server:/path/to/destination/

# 或使用 rsync
rsync -avz docker-controller-image.tar.gz user@target-server:/path/to/destination/
```

### 3. 在目标服务器上导入镜像

```bash
# 如果是压缩文件，先解压
gunzip docker-controller-image.tar.gz

# 导入镜像
docker load -i docker-controller-image.tar

# 验证镜像已导入
docker images | grep docker-controller
```

### 4. 运行容器

#### 方式 A：使用 Docker Compose（推荐）

1. 将 `docker-compose.yml` 复制到服务器
2. 根据实际情况修改配置（端口、路径等）
3. 启动服务：

```bash
docker-compose up -d
```

#### 方式 B：直接运行 Docker 命令

```bash
docker run -d \
  --name docker-controller \
  --restart unless-stopped \
  -p 8011:8011 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /vol1/1000/downloads:/downloads:ro \
  -e NODE_ENV=production \
  -e PORT=8011 \
  -e MONITORED_CONTAINERS=arr \
  -e MONITOR_ENABLED=true \
  -e MONITOR_PATH=/downloads \
  -e EXCLUDE_FOLDER=incomplete \
  -e START_THRESHOLD_GB=100 \
  -e STOP_THRESHOLD_GB=50 \
  docker-controller:latest
```

---

## 方法二：直接在目标服务器构建

如果目标服务器有网络连接，可以直接构建：

```bash
# 克隆或传输源代码到服务器
git clone <repository-url>
cd rswd

# 构建并启动
docker-compose up -d --build
```

---

## 方法三：使用 Docker Registry（适合团队和多服务器部署）

### 1. 构建并推送到私有 Registry

```bash
# 登录到私有 Registry
docker login your-registry.com

# 构建并打标签
docker build -t your-registry.com/docker-controller:1.0.0 .
docker build -t your-registry.com/docker-controller:latest .

# 推送到 Registry
docker push your-registry.com/docker-controller:1.0.0
docker push your-registry.com/docker-controller:latest
```

### 2. 在目标服务器拉取

```bash
# 登录到私有 Registry
docker login your-registry.com

# 拉取镜像
docker pull your-registry.com/docker-controller:latest

# 运行容器
docker-compose up -d
```

---

## 环境变量配置说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | production | 运行环境 |
| `PORT` | 8011 | 服务端口 |
| `MONITORED_CONTAINERS` | arr | 监控的容器模式（支持 arr, *arr, 具体容器名） |
| `MONITOR_ENABLED` | true | 是否启用文件夹监控 |
| `MONITOR_PATH` | /downloads | 监控的文件夹路径 |
| `EXCLUDE_FOLDER` | incomplete | 排除的子文件夹 |
| `START_THRESHOLD_GB` | 100 | 启动容器的阈值（GB） |
| `STOP_THRESHOLD_GB` | 50 | 停止容器的阈值（GB） |

---

## 访问应用

启动成功后，通过浏览器访问：

```
http://your-server-ip:8011
```

---

## 常用管理命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新服务（使用新镜像）
docker-compose pull
docker-compose up -d

# 查看容器状态
docker-compose ps

# 进入容器
docker-compose exec docker-controller sh
```

---

## 故障排查

### 容器无法启动

1. 检查日志：`docker-compose logs docker-controller`
2. 验证 Docker socket 权限：`ls -la /var/run/docker.sock`
3. 确保端口未被占用：`netstat -tlnp | grep 8011`

### 无法控制宿主机容器

1. 确认 Docker socket 已正确挂载：`docker inspect docker-controller | grep docker.sock`
2. 检查容器是否有权限访问 Docker socket

### 文件夹监控不工作

1. 确认监控路径已正确挂载
2. 检查路径权限：容器需要读取权限
3. 验证环境变量配置正确

---

## 安全建议

1. **限制访问**：建议使用反向代理（如 Nginx）并添加认证
2. **网络隔离**：仅在内网环境使用，避免直接暴露到公网
3. **最小权限**：Docker socket 权限很高，确保容器在受信任的环境中运行
4. **定期更新**：及时更新基础镜像和依赖包

---

## 卸载

```bash
# 停止并删除容器
docker-compose down

# 删除镜像
docker rmi docker-controller:latest

# 删除网络（如果不再需要）
docker network rm docker-controller-network
```

---

## 技术支持

- 项目文档：查看 README.md 和 CONFIG.md
- 问题反馈：提交 Issue 或联系管理员

