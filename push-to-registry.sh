#!/bin/bash

# 推送镜像到自定义 Docker Registry
# 用法: ./push-to-registry.sh [registry-url] [username]

set -e

IMAGE_NAME="qbarr"
IMAGE_VERSION="1.0.0"

REGISTRY_URL="${1}"
REGISTRY_USERNAME="${2}"

if [ -z "$REGISTRY_URL" ]; then
    echo "请输入 Registry 地址 (例如: registry.example.com 或 quay.io):"
    read REGISTRY_URL
fi

if [ -z "$REGISTRY_USERNAME" ]; then
    echo "请输入用户名:"
    read REGISTRY_USERNAME
fi

if [ -z "$REGISTRY_URL" ] || [ -z "$REGISTRY_USERNAME" ]; then
    echo "错误: 必须提供 Registry 地址和用户名"
    exit 1
fi

echo "=========================================="
echo "推送镜像到自定义 Registry"
echo "=========================================="
echo "Registry: ${REGISTRY_URL}"
echo "用户名: ${REGISTRY_USERNAME}"
echo "镜像名: ${IMAGE_NAME}"
echo "版本号: ${IMAGE_VERSION}"
echo ""

# 登录 Registry
echo "登录 Registry..."
docker login ${REGISTRY_URL} -u ${REGISTRY_USERNAME}

# 构建镜像
echo ""
echo "构建镜像..."
docker build -t ${IMAGE_NAME}:${IMAGE_VERSION} \
             -t ${IMAGE_NAME}:latest \
             .

# 打标签
echo ""
echo "为镜像打标签..."
docker tag ${IMAGE_NAME}:${IMAGE_VERSION} ${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}
docker tag ${IMAGE_NAME}:latest ${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_NAME}:latest

# 推送镜像
echo ""
echo "推送镜像到 Registry..."
docker push ${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}
docker push ${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_NAME}:latest

echo ""
echo "=========================================="
echo "✓ 推送完成！"
echo "=========================================="
echo ""
echo "镜像地址:"
echo "  docker pull ${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_NAME}:${IMAGE_VERSION}"
echo "  docker pull ${REGISTRY_URL}/${REGISTRY_USERNAME}/${IMAGE_NAME}:latest"
echo ""

