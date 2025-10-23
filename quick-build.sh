#!/bin/bash

# 快速构建脚本（无交互）
# 用法: ./quick-build.sh [version]

set -e

IMAGE_NAME="docker-controller"
IMAGE_VERSION="${1:-1.0.0}"
IMAGE_TAG="latest"
OUTPUT_FILE="docker-controller-image.tar"

echo "构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} \
             -t ${IMAGE_NAME}:${IMAGE_VERSION} \
             .

echo "导出镜像到文件..."
docker save -o ${OUTPUT_FILE} ${IMAGE_NAME}:${IMAGE_TAG}

echo ""
echo "✓ 完成！"
echo "镜像文件: ${OUTPUT_FILE}"
echo "文件大小: $(du -h ${OUTPUT_FILE} | cut -f1)"
echo ""
echo "导入方法: docker load -i ${OUTPUT_FILE}"

