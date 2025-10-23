import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Docker from 'dockerode';

@Injectable()
export class DockerService implements OnModuleInit {
  private readonly logger = new Logger(DockerService.name);
  private docker: Docker;

  onModuleInit() {
    try {
      // 连接到宿主机的Docker守护进程
      // 通过挂载 /var/run/docker.sock 实现
      this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
      this.logger.log('✅ 成功连接到Docker守护进程');
    } catch (error) {
      this.logger.error('❌ 连接Docker守护进程失败', error);
      throw error;
    }
  }

  /**
   * 获取要监控的容器名称列表
   */
  private getMonitoredContainers(): string[] {
    const envContainers = process.env.MONITORED_CONTAINERS;
    if (envContainers) {
      return envContainers.split(',').map(name => name.trim().toLowerCase());
    }
    // 默认监控所有 *arr 系列容器
    return ['arr'];
  }

  /**
   * 检查容器是否在监控列表中
   */
  private isMonitored(containerName: string): boolean {
    const monitoredContainers = this.getMonitoredContainers();
    const normalizedName = containerName.toLowerCase();
    return monitoredContainers.some(name => normalizedName.includes(name));
  }

  /**
   * 列出所有容器（仅返回监控列表中的容器）
   */
  async listContainers(all = true) {
    try {
      const containers = await this.docker.listContainers({ all });
      const monitoredContainers = this.getMonitoredContainers();
      
      this.logger.log(`监控的容器列表: ${monitoredContainers.join(', ')}`);
      
      const filteredContainers = containers
        .filter((container) => {
          const name = container.Names[0].replace('/', '');
          return this.isMonitored(name);
        })
        .map((container) => ({
          id: container.Id.substring(0, 12),
          name: container.Names[0].replace('/', ''),
          image: container.Image,
          status: container.Status,
          state: container.State,
          ports: container.Ports,
          created: container.Created,
        }));
      
      this.logger.log(`找到 ${filteredContainers.length} 个监控的容器`);
      return filteredContainers;
    } catch (error) {
      this.logger.error('列出容器失败', error);
      throw error;
    }
  }

  /**
   * 验证容器是否可操作
   */
  private async validateContainer(id: string): Promise<string> {
    const container = this.docker.getContainer(id);
    const info = await container.inspect();
    const containerName = info.Name.replace('/', '');
    
    if (!this.isMonitored(containerName)) {
      throw new Error(`容器 ${containerName} 不在监控列表中，无法操作`);
    }
    
    return containerName;
  }

  /**
   * 启动容器
   */
  async startContainer(id: string) {
    try {
      const containerName = await this.validateContainer(id);
      const container = this.docker.getContainer(id);
      await container.start();
      this.logger.log(`✅ 容器 ${containerName} 已启动`);
      return { message: '容器已启动' };
    } catch (error) {
      this.logger.error(`启动容器 ${id} 失败`, error);
      throw error;
    }
  }

  /**
   * 停止容器
   */
  async stopContainer(id: string, timeout = 10) {
    try {
      const containerName = await this.validateContainer(id);
      const container = this.docker.getContainer(id);
      await container.stop({ t: timeout });
      this.logger.log(`⏹️ 容器 ${containerName} 已停止`);
      return { message: '容器已停止' };
    } catch (error) {
      this.logger.error(`停止容器 ${id} 失败`, error);
      throw error;
    }
  }

}

