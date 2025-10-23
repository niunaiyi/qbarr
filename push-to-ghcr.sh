#!/bin/bash

# 推送镜像到 GitHub Container Registry (ghcr.io)
# 用法: ./push-to-ghcr.sh [your-github-username]

set -e

IMAGE_NAME="docker-controller"
IMAGE_VERSION="1.0.0"

# 从参数获取用户名，或使用默认值
GITHUB_USERNAME="${1}"

if [ -z "$GITHUB_USERNAME" ]; then
    echo "请输入您的 GitHub 用户名:"
    read GITHUB_USERNAME
fi

if [ -z "$GITHUB_USERNAME" ]; then
    echo "错误: 必须提供 GitHub 用户名"
    exit 1
fi

echo "=========================================="
echo "推送镜像到 GitHub Container Registry"
echo "=========================================="
echo "用户名: ${GITHUB_USERNAME}"
echo "镜像名: ${IMAGE_NAME}"
echo "版本号: ${IMAGE_VERSION}"
echo ""

# 登录 GitHub Container Registry
echo "登录 GitHub Container Registry..."
echo "提示: 需要使用 Personal Access Token (PAT) 而不是密码"
echo "PAT 权限需要: write:packages, read:packages, delete:packages"
echo ""
docker login ghcr.io -u ${GITHUB_USERNAME}

# 构建镜像
echo ""
echo "构建镜像..."
docker build -t ${IMAGE_NAME}:${IMAGE_VERSION} \
             -t ${IMAGE_NAME}:latest \
             .

# 打标签
echo ""
echo "为镜像打标签..."
docker tag ${IMAGE_NAME}:${IMAGE_VERSION} ghcr.io/${GITHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}
docker tag ${IMAGE_NAME}:latest ghcr.io/${GITHUB_USERNAME}/${IMAGE_NAME}:latest

# 推送镜像
echo ""
echo "推送镜像到 ghcr.io..."
docker push ghcr.io/${GITHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}
docker push ghcr.io/${GITHUB_USERNAME}/${IMAGE_NAME}:latest

echo ""
echo "=========================================="
echo "✓ 推送完成！"
echo "=========================================="
echo ""
echo "镜像地址:"
echo "  docker pull ghcr.io/${GITHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}"
echo "  docker pull ghcr.io/${GITHUB_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo "GHCR 页面:"
echo "  https://github.com/${GITHUB_USERNAME}?tab=packages"
echo ""
echo "注意: 新推送的镜像默认是私有的，可以在 GitHub 上设置为公开"
echo ""

