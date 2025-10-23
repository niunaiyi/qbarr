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
   * 获取容器详情（检查是否在监控列表中）
   */
  async getContainer(id: string) {
    try {
      const container = this.docker.getContainer(id);
      const info = await container.inspect();
      const containerName = info.Name.replace('/', '');
      
      // 检查是否在监控列表中
      if (!this.isMonitored(containerName)) {
        throw new Error(`容器 ${containerName} 不在监控列表中`);
      }
      
      return {
        id: info.Id.substring(0, 12),
        name: containerName,
        image: info.Config.Image,
        status: info.State.Status,
        running: info.State.Running,
        paused: info.State.Paused,
        created: info.Created,
        ports: info.NetworkSettings.Ports,
        state: info.State,
        config: info.Config,
      };
    } catch (error) {
      this.logger.error(`获取容器 ${id} 详情失败`, error);
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

  /**
   * 重启容器
   */
  async restartContainer(id: string, timeout = 10) {
    try {
      const containerName = await this.validateContainer(id);
      const container = this.docker.getContainer(id);
      await container.restart({ t: timeout });
      this.logger.log(`🔄 容器 ${containerName} 已重启`);
      return { message: '容器已重启' };
    } catch (error) {
      this.logger.error(`重启容器 ${id} 失败`, error);
      throw error;
    }
  }

  /**
   * 暂停容器
   */
  async pauseContainer(id: string) {
    try {
      const containerName = await this.validateContainer(id);
      const container = this.docker.getContainer(id);
      await container.pause();
      this.logger.log(`⏸️ 容器 ${containerName} 已暂停`);
      return { message: '容器已暂停' };
    } catch (error) {
      this.logger.error(`暂停容器 ${id} 失败`, error);
      throw error;
    }
  }

  /**
   * 恢复容器
   */
  async unpauseContainer(id: string) {
    try {
      const containerName = await this.validateContainer(id);
      const container = this.docker.getContainer(id);
      await container.unpause();
      this.logger.log(`▶️ 容器 ${containerName} 已恢复`);
      return { message: '容器已恢复' };
    } catch (error) {
      this.logger.error(`恢复容器 ${id} 失败`, error);
      throw error;
    }
  }

  /**
   * 删除容器
   */
  async removeContainer(id: string, force = false) {
    try {
      const containerName = await this.validateContainer(id);
      const container = this.docker.getContainer(id);
      await container.remove({ force });
      this.logger.log(`🗑️ 容器 ${containerName} 已删除`);
      return { message: '容器已删除' };
    } catch (error) {
      this.logger.error(`删除容器 ${id} 失败`, error);
      throw error;
    }
  }

  /**
   * 列出所有镜像
   */
  async listImages() {
    try {
      const images = await this.docker.listImages();
      return images.map((image) => ({
        id: image.Id.substring(7, 19),
        tags: image.RepoTags || [],
        size: image.Size,
        created: image.Created,
      }));
    } catch (error) {
      this.logger.error('列出镜像失败', error);
      throw error;
    }
  }

  /**
   * 获取Docker信息
   */
  async getDockerInfo() {
    try {
      const info = await this.docker.info();
      return {
        containers: info.Containers,
        containersRunning: info.ContainersRunning,
        containersPaused: info.ContainersPaused,
        containersStopped: info.ContainersStopped,
        images: info.Images,
        serverVersion: info.ServerVersion,
        operatingSystem: info.OperatingSystem,
        architecture: info.Architecture,
        memTotal: info.MemTotal,
        cpus: info.NCPU,
      };
    } catch (error) {
      this.logger.error('获取Docker信息失败', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      await this.docker.ping();
      return {
        status: 'healthy',
        dockerConnected: true,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        dockerConnected: false,
        error: error.message,
      };
    }
  }
}

