#!/bin/bash

# 推送镜像到 Docker Hub
# 用法: ./push-to-dockerhub.sh [your-dockerhub-username]

set -e

IMAGE_NAME="docker-controller"
IMAGE_VERSION="1.0.0"

# 从参数获取用户名，或使用默认值
DOCKER_USERNAME="${1}"

if [ -z "$DOCKER_USERNAME" ]; then
    echo "请输入您的 Docker Hub 用户名:"
    read DOCKER_USERNAME
fi

if [ -z "$DOCKER_USERNAME" ]; then
    echo "错误: 必须提供 Docker Hub 用户名"
    exit 1
fi

echo "=========================================="
echo "推送镜像到 Docker Hub"
echo "=========================================="
echo "用户名: ${DOCKER_USERNAME}"
echo "镜像名: ${IMAGE_NAME}"
echo "版本号: ${IMAGE_VERSION}"
echo ""

# 登录 Docker Hub
echo "登录 Docker Hub..."
docker login

# 构建镜像
echo ""
echo "构建镜像..."
docker build -t ${IMAGE_NAME}:${IMAGE_VERSION} \
             -t ${IMAGE_NAME}:latest \
             .

# 打标签
echo ""
echo "为镜像打标签..."
docker tag ${IMAGE_NAME}:${IMAGE_VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}
docker tag ${IMAGE_NAME}:latest ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

# 推送镜像
echo ""
echo "推送镜像到 Docker Hub..."
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

echo ""
echo "=========================================="
echo "✓ 推送完成！"
echo "=========================================="
echo ""
echo "镜像地址:"
echo "  docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}"
echo "  docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo "Docker Hub 页面:"
echo "  https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
echo ""

