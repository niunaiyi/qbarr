#!/bin/bash

# Docker Controller 镜像构建和导出脚本
# 用途：构建 Docker 镜像并导出为 .tar 文件，方便在其他机器上部署

set -e

# 配置
IMAGE_NAME="qbarr"
IMAGE_TAG="latest"
IMAGE_VERSION="1.0.0"
OUTPUT_FILE="qbarr-image.tar"

echo "=========================================="
echo "Docker Controller 镜像构建脚本"
echo "=========================================="
echo ""

# 显示当前配置
echo "镜像名称: ${IMAGE_NAME}"
echo "镜像标签: ${IMAGE_TAG}"
echo "镜像版本: ${IMAGE_VERSION}"
echo "输出文件: ${OUTPUT_FILE}"
echo ""

# 询问是否继续
read -p "是否继续构建? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消构建"
    exit 0
fi

# 清理旧的输出文件
if [ -f "${OUTPUT_FILE}" ]; then
    echo "删除旧的镜像文件..."
    rm "${OUTPUT_FILE}"
fi

# 构建镜像
echo ""
echo "步骤 1/3: 构建 Docker 镜像..."
echo "=========================================="
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} \
             -t ${IMAGE_NAME}:${IMAGE_VERSION} \
             .

# 显示镜像信息
echo ""
echo "步骤 2/3: 镜像构建完成"
echo "=========================================="
docker images | grep ${IMAGE_NAME}

# 导出镜像
echo ""
echo "步骤 3/3: 导出镜像到文件..."
echo "=========================================="
docker save -o ${OUTPUT_FILE} ${IMAGE_NAME}:${IMAGE_TAG}

# 压缩镜像文件（可选）
echo ""
read -p "是否压缩镜像文件? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "压缩镜像文件..."
    gzip -f ${OUTPUT_FILE}
    OUTPUT_FILE="${OUTPUT_FILE}.gz"
fi

# 显示结果
echo ""
echo "=========================================="
echo "✓ 构建完成!"
echo "=========================================="
echo "镜像文件: ${OUTPUT_FILE}"
echo "文件大小: $(du -h ${OUTPUT_FILE} | cut -f1)"
echo ""
echo "部署方法："
if [[ $OUTPUT_FILE == *.gz ]]; then
    echo "1. 传输文件到目标服务器"
    echo "2. 解压: gunzip ${OUTPUT_FILE}"
    echo "3. 导入: docker load -i ${OUTPUT_FILE%.gz}"
else
    echo "1. 传输文件到目标服务器"
    echo "2. 导入: docker load -i ${OUTPUT_FILE}"
fi
echo "3. 使用 docker-compose.yml 或直接运行容器"
echo ""

