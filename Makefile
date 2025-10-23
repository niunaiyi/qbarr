.PHONY: build save load run stop clean help

IMAGE_NAME=docker-controller
IMAGE_TAG=latest
IMAGE_VERSION=1.0.0
TAR_FILE=docker-controller-image.tar

help:  ## 显示帮助信息
	@echo "Docker Controller 构建工具"
	@echo ""
	@echo "可用命令:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build:  ## 构建 Docker 镜像
	@echo "构建镜像 $(IMAGE_NAME):$(IMAGE_TAG)..."
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) \
	             -t $(IMAGE_NAME):$(IMAGE_VERSION) \
	             .
	@echo "✓ 构建完成"

save: build  ## 构建并导出镜像到 tar 文件
	@echo "导出镜像到 $(TAR_FILE)..."
	docker save -o $(TAR_FILE) $(IMAGE_NAME):$(IMAGE_TAG)
	@echo "✓ 导出完成: $(TAR_FILE) ($(shell du -h $(TAR_FILE) | cut -f1))"

save-compressed: save  ## 构建并导出压缩的镜像
	@echo "压缩镜像文件..."
	gzip -f $(TAR_FILE)
	@echo "✓ 完成: $(TAR_FILE).gz ($(shell du -h $(TAR_FILE).gz | cut -f1))"

load:  ## 从 tar 文件加载镜像
	@if [ -f "$(TAR_FILE).gz" ]; then \
		echo "解压缩镜像文件..."; \
		gunzip $(TAR_FILE).gz; \
	fi
	@echo "加载镜像 $(TAR_FILE)..."
	docker load -i $(TAR_FILE)
	@echo "✓ 加载完成"

run:  ## 使用 docker-compose 启动服务
	@echo "启动服务..."
	docker-compose up -d
	@echo "✓ 服务已启动"
	@echo "访问地址: http://localhost:8011"

stop:  ## 停止服务
	@echo "停止服务..."
	docker-compose down
	@echo "✓ 服务已停止"

logs:  ## 查看日志
	docker-compose logs -f

restart:  ## 重启服务
	@echo "重启服务..."
	docker-compose restart
	@echo "✓ 服务已重启"

clean:  ## 清理构建文件和镜像
	@echo "清理构建文件..."
	@rm -f $(TAR_FILE) $(TAR_FILE).gz
	@echo "删除 Docker 镜像..."
	@docker rmi $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):$(IMAGE_VERSION) 2>/dev/null || true
	@echo "✓ 清理完成"

test-build:  ## 测试构建（不缓存）
	@echo "测试构建（无缓存）..."
	docker build --no-cache -t $(IMAGE_NAME):test .
	@echo "✓ 测试构建完成"

images:  ## 查看本地镜像
	@docker images | grep $(IMAGE_NAME) || echo "未找到镜像"

ps:  ## 查看运行状态
	@docker-compose ps

deploy-package: save-compressed  ## 创建完整的部署包
	@echo "创建部署包..."
	@mkdir -p deploy
	@cp $(TAR_FILE).gz deploy/
	@cp docker-compose.yml deploy/
	@cp DEPLOY.md deploy/
	@echo "✓ 部署包已创建在 deploy/ 目录"
	@echo "内容: $(shell ls -lh deploy/ | tail -n +2)"

push-dockerhub:  ## 推送到 Docker Hub (需要设置 DOCKER_USER 环境变量)
	@if [ -z "$(DOCKER_USER)" ]; then \
		echo "错误: 请设置 DOCKER_USER 环境变量"; \
		echo "示例: make push-dockerhub DOCKER_USER=your-username"; \
		exit 1; \
	fi
	@./push-to-dockerhub.sh $(DOCKER_USER)

push-ghcr:  ## 推送到 GitHub Container Registry (需要设置 GITHUB_USER 环境变量)
	@if [ -z "$(GITHUB_USER)" ]; then \
		echo "错误: 请设置 GITHUB_USER 环境变量"; \
		echo "示例: make push-ghcr GITHUB_USER=your-username"; \
		exit 1; \
	fi
	@./push-to-ghcr.sh $(GITHUB_USER)

push-registry:  ## 推送到自定义 Registry (需要设置 REGISTRY_URL 和 REGISTRY_USER)
	@if [ -z "$(REGISTRY_URL)" ] || [ -z "$(REGISTRY_USER)" ]; then \
		echo "错误: 请设置 REGISTRY_URL 和 REGISTRY_USER 环境变量"; \
		echo "示例: make push-registry REGISTRY_URL=registry.example.com REGISTRY_USER=your-username"; \
		exit 1; \
	fi
	@./push-to-registry.sh $(REGISTRY_URL) $(REGISTRY_USER)

