# Docker 镜像发布指南

本指南介绍如何将 Docker Controller 镜像发布到各种容器镜像仓库。

---

## 目录

1. [发布到 Docker Hub](#1-发布到-docker-hub)
2. [发布到 GitHub Container Registry](#2-发布到-github-container-registry-ghcrio)
3. [发布到 Quay.io](#3-发布到-quayio)
4. [发布到私有 Registry](#4-发布到私有-registry)
5. [自动化发布 (CI/CD)](#5-自动化发布-cicd)

---

## 1. 发布到 Docker Hub

Docker Hub 是最流行的公共容器镜像仓库。

### 前置准备

1. 注册 Docker Hub 账号：https://hub.docker.com/signup
2. 确认已安装 Docker 并已登录

### 方法 A：使用脚本（推荐）

```bash
# 运行推送脚本
./push-to-dockerhub.sh your-dockerhub-username

# 或使用 Makefile
make push-dockerhub DOCKER_USER=your-dockerhub-username
```

### 方法 B：手动操作

```bash
# 1. 登录 Docker Hub
docker login

# 2. 构建镜像
docker build -t docker-controller:1.0.0 .

# 3. 打标签
docker tag docker-controller:1.0.0 your-username/docker-controller:1.0.0
docker tag docker-controller:1.0.0 your-username/docker-controller:latest

# 4. 推送镜像
docker push your-username/docker-controller:1.0.0
docker push your-username/docker-controller:latest
```

### 使用发布的镜像

```bash
# 拉取镜像
docker pull your-username/docker-controller:latest

# 运行容器
docker run -d \
  --name docker-controller \
  -p 8011:8011 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  your-username/docker-controller:latest
```

### 设置为公开镜像

1. 访问 https://hub.docker.com/repositories
2. 找到你的仓库
3. 点击 Settings -> Make Public

---

## 2. 发布到 GitHub Container Registry (ghcr.io)

GitHub Container Registry 是 GitHub 提供的容器镜像服务，与 GitHub 仓库深度集成。

### 前置准备

1. 有 GitHub 账号
2. 创建 Personal Access Token (PAT)：
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择权限：`write:packages`, `read:packages`, `delete:packages`
   - 保存生成的 token

### 使用脚本发布

```bash
# 运行推送脚本
./push-to-ghcr.sh your-github-username

# 或使用 Makefile
make push-ghcr GITHUB_USER=your-github-username

# 登录时输入：
# Username: your-github-username
# Password: 粘贴你的 Personal Access Token
```

### 手动操作

```bash
# 1. 登录 GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u your-github-username --password-stdin

# 2. 构建镜像
docker build -t docker-controller:1.0.0 .

# 3. 打标签
docker tag docker-controller:1.0.0 ghcr.io/your-github-username/docker-controller:1.0.0
docker tag docker-controller:1.0.0 ghcr.io/your-github-username/docker-controller:latest

# 4. 推送镜像
docker push ghcr.io/your-github-username/docker-controller:1.0.0
docker push ghcr.io/your-github-username/docker-controller:latest
```

### 设置为公开镜像

1. 访问：https://github.com/your-username?tab=packages
2. 点击你的包
3. 点击 "Package settings"
4. 在 "Danger Zone" 部分，点击 "Change visibility" -> "Public"

### 使用发布的镜像

```bash
# 公开镜像（无需登录）
docker pull ghcr.io/your-github-username/docker-controller:latest

# 私有镜像（需要登录）
docker login ghcr.io
docker pull ghcr.io/your-github-username/docker-controller:latest
```

---

## 3. 发布到 Quay.io

Quay.io 是 Red Hat 提供的容器镜像仓库服务。

### 前置准备

1. 注册 Quay.io 账号：https://quay.io/signin/
2. 创建机器人账号（可选，用于 CI/CD）

### 发布步骤

```bash
# 1. 登录 Quay.io
docker login quay.io
# 用户名: your-quay-username
# 密码: 你的密码

# 2. 使用脚本
./push-to-registry.sh quay.io your-quay-username

# 3. 或手动推送
docker build -t docker-controller:1.0.0 .
docker tag docker-controller:1.0.0 quay.io/your-username/docker-controller:1.0.0
docker tag docker-controller:1.0.0 quay.io/your-username/docker-controller:latest
docker push quay.io/your-username/docker-controller:1.0.0
docker push quay.io/your-username/docker-controller:latest
```

### 使用发布的镜像

```bash
docker pull quay.io/your-username/docker-controller:latest
```

---

## 4. 发布到私有 Registry

### 4.1 使用自托管 Docker Registry

```bash
# 使用通用脚本
./push-to-registry.sh registry.example.com your-username

# 或手动操作
docker login registry.example.com
docker tag docker-controller:1.0.0 registry.example.com/your-username/docker-controller:1.0.0
docker push registry.example.com/your-username/docker-controller:1.0.0
```

### 4.2 阿里云容器镜像服务

```bash
# 登录阿里云镜像仓库
docker login --username=your-aliyun-username registry.cn-hangzhou.aliyuncs.com

# 打标签并推送
docker tag docker-controller:1.0.0 registry.cn-hangzhou.aliyuncs.com/your-namespace/docker-controller:1.0.0
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/docker-controller:1.0.0
```

### 4.3 腾讯云容器镜像服务

```bash
# 登录腾讯云镜像仓库
docker login ccr.ccs.tencentyun.com --username=your-tencent-username

# 打标签并推送
docker tag docker-controller:1.0.0 ccr.ccs.tencentyun.com/your-namespace/docker-controller:1.0.0
docker push ccr.ccs.tencentyun.com/your-namespace/docker-controller:1.0.0
```

---

## 5. 自动化发布 (CI/CD)

### 5.1 GitHub Actions 示例

创建 `.github/workflows/docker-publish.yml`：

```yaml
name: Publish Docker Image

on:
  push:
    branches: [ main, master ]
    tags: [ 'v*' ]
  release:
    types: [ published ]

env:
  IMAGE_NAME: docker-controller

jobs:
  push-to-registries:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      # 登录到 Docker Hub
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      # 登录到 GitHub Container Registry
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 提取元数据（标签、版本等）
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: |
            ${{ secrets.DOCKER_USERNAME }}/${{ env.IMAGE_NAME }}
            ghcr.io/${{ github.repository_owner }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=latest,enable={{is_default_branch}}

      # 构建并推送
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 5.2 配置 GitHub Secrets

在 GitHub 仓库设置中添加：

1. `DOCKER_USERNAME`: Docker Hub 用户名
2. `DOCKER_PASSWORD`: Docker Hub 密码或访问令牌

### 5.3 GitLab CI/CD 示例

创建 `.gitlab-ci.yml`：

```yaml
stages:
  - build
  - push

variables:
  IMAGE_NAME: docker-controller
  DOCKER_DRIVER: overlay2

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $IMAGE_NAME:$CI_COMMIT_SHA .
    - docker tag $IMAGE_NAME:$CI_COMMIT_SHA $IMAGE_NAME:latest
    - docker save $IMAGE_NAME:latest > image.tar
  artifacts:
    paths:
      - image.tar
    expire_in: 1 hour

push:
  stage: push
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker load < image.tar
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin
    - docker tag $IMAGE_NAME:latest $CI_REGISTRY_USER/$IMAGE_NAME:latest
    - docker push $CI_REGISTRY_USER/$IMAGE_NAME:latest
  only:
    - main
    - tags
```

---

## 最佳实践

### 1. 版本标签策略

```bash
# 推送多个标签
docker push username/docker-controller:1.0.0    # 完整版本
docker push username/docker-controller:1.0      # 次版本
docker push username/docker-controller:1        # 主版本
docker push username/docker-controller:latest   # 最新版本
```

### 2. 多架构支持

使用 Docker Buildx 构建多架构镜像：

```bash
# 创建 builder
docker buildx create --name mybuilder --use

# 构建并推送多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t username/docker-controller:latest \
  --push .
```

### 3. 镜像签名

使用 Docker Content Trust：

```bash
# 启用 DCT
export DOCKER_CONTENT_TRUST=1

# 推送时自动签名
docker push username/docker-controller:latest
```

### 4. 安全扫描

```bash
# 使用 Trivy 扫描
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image username/docker-controller:latest

# 使用 Docker Scout
docker scout cves username/docker-controller:latest
```

---

## 常见问题

### Q: 如何删除已发布的镜像？

**Docker Hub:**
```bash
# 使用 Docker Hub API
curl -X DELETE \
  -H "Authorization: JWT ${TOKEN}" \
  https://hub.docker.com/v2/repositories/username/docker-controller/tags/1.0.0/
```

**GitHub Container Registry:**
```bash
# 在 GitHub 网页界面删除，或使用 GitHub API
```

### Q: 如何设置自动构建？

大多数镜像仓库支持连接 GitHub 仓库进行自动构建：
- Docker Hub: 在仓库设置中连接 GitHub
- Quay.io: 使用构建触发器
- GHCR: 使用 GitHub Actions

### Q: 镜像太大怎么办？

1. 使用多阶段构建（已在 Dockerfile 中实现）
2. 使用更小的基础镜像（如 alpine）
3. 清理不必要的文件和缓存
4. 使用 `.dockerignore` 排除不需要的文件

### Q: 如何加速国内访问？

使用镜像加速器或国内镜像仓库：
- 阿里云容器镜像服务
- 腾讯云容器镜像服务
- 华为云容器镜像服务

---

## 快速参考

```bash
# Docker Hub
./push-to-dockerhub.sh your-username

# GitHub Container Registry
./push-to-ghcr.sh your-github-username

# Quay.io
./push-to-registry.sh quay.io your-username

# 自定义 Registry
./push-to-registry.sh registry.example.com your-username

# 使用 Makefile
make push-dockerhub DOCKER_USER=your-username
make push-ghcr GITHUB_USER=your-github-username
make push-registry REGISTRY_URL=registry.example.com REGISTRY_USER=your-username
```

---

## 相关文档

- [DEPLOY.md](DEPLOY.md) - 部署指南
- [README.md](README.md) - 项目文档
- [CONFIG.md](CONFIG.md) - 配置说明

