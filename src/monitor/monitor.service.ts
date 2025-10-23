import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DockerService } from '../docker/docker.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);
  private monitorPath = '';
  private excludeFolder = '';
  private startThresholdGB = 0;
  private stopThresholdGB = 0;
  private lastAction = ''; // 记录上次操作，避免重复操作

  constructor(private readonly dockerService: DockerService) {
    this.initConfig();
  }

  /**
   * 初始化配置
   */
  private initConfig() {
    // 监控路径
    this.monitorPath = process.env.MONITOR_PATH || '/downloads';
    
    // 排除的文件夹
    this.excludeFolder = process.env.EXCLUDE_FOLDER || 'incomplete';
    
    // 启动阈值（GB）
    this.startThresholdGB = parseFloat(process.env.START_THRESHOLD_GB || '100');
    
    // 停止阈值（GB）
    this.stopThresholdGB = parseFloat(process.env.STOP_THRESHOLD_GB || '50');

    this.logger.log('📊 文件夹监控已启用');
    this.logger.log(`📁 监控路径: ${this.monitorPath}`);
    this.logger.log(`🚫 排除文件夹: ${this.excludeFolder}`);
    this.logger.log(`🟢 启动阈值: ${this.startThresholdGB} GB`);
    this.logger.log(`🔴 停止阈值: ${this.stopThresholdGB} GB`);
  }

  /**
   * 定时任务：每5分钟检查一次
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkFolderSize() {
    try {
      // 计算文件夹大小
      const sizeInGB = await this.calculateFolderSize();
      
      this.logger.log(`📊 当前文件夹大小: ${sizeInGB.toFixed(2)} GB`);

      // 判断是否需要启动容器
      if (sizeInGB >= this.startThresholdGB) {
        if (this.lastAction !== 'start') {
          this.logger.log(`🟢 文件夹大小 (${sizeInGB.toFixed(2)} GB) >= 启动阈值 (${this.startThresholdGB} GB)`);
          await this.startAllContainers();
          this.lastAction = 'start';
        }
      }
      // 判断是否需要停止容器
      else if (sizeInGB <= this.stopThresholdGB) {
        if (this.lastAction !== 'stop') {
          this.logger.log(`🔴 文件夹大小 (${sizeInGB.toFixed(2)} GB) <= 停止阈值 (${this.stopThresholdGB} GB)`);
          await this.stopAllContainers();
          this.lastAction = 'stop';
        }
      }
      // 在两个阈值之间，不做操作
      else {
        this.logger.log(`⚪ 文件夹大小在阈值之间 (${this.stopThresholdGB} GB ~ ${this.startThresholdGB} GB)，保持当前状态`);
      }

    } catch (error) {
      this.logger.error(`检查文件夹大小失败: ${error.message}`);
    }
  }

  /**
   * 计算文件夹大小（排除指定文件夹）
   */
  private async calculateFolderSize(): Promise<number> {
    try {
      // 检查路径是否存在
      if (!fs.existsSync(this.monitorPath)) {
        this.logger.warn(`监控路径不存在: ${this.monitorPath}`);
        return 0;
      }

      let totalSizeBytes = 0;

      // 读取目录内容
      const entries = fs.readdirSync(this.monitorPath, { withFileTypes: true });

      for (const entry of entries) {
        // 跳过排除的文件夹
        if (entry.name === this.excludeFolder) {
          continue;
        }

        const fullPath = path.join(this.monitorPath, entry.name);

        if (entry.isDirectory()) {
          // 递归计算子文件夹大小
          totalSizeBytes += this.getFolderSizeSync(fullPath);
        } else if (entry.isFile()) {
          // 计算文件大小
          const stats = fs.statSync(fullPath);
          totalSizeBytes += stats.size;
        }
      }

      // 转换为 GB
      const sizeInGB = totalSizeBytes / (1024 * 1024 * 1024);
      return sizeInGB;

    } catch (error) {
      this.logger.error(`计算文件夹大小失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 递归获取文件夹大小（同步方式）
   */
  private getFolderSizeSync(folderPath: string): number {
    let totalSize = 0;

    try {
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);

        try {
          if (entry.isDirectory()) {
            totalSize += this.getFolderSizeSync(fullPath);
          } else if (entry.isFile()) {
            const stats = fs.statSync(fullPath);
            totalSize += stats.size;
          }
        } catch (err) {
          // 忽略无权限访问的文件
          this.logger.debug(`无法访问: ${fullPath}`);
        }
      }
    } catch (err) {
      this.logger.debug(`无法读取目录: ${folderPath}`);
    }

    return totalSize;
  }

  /**
   * 启动所有监控的容器
   */
  private async startAllContainers() {
    try {
      this.logger.log('🚀 开始启动所有 *arr 容器...');
      
      const containers = await this.dockerService.listContainers(true);
      
      for (const container of containers) {
        // 只启动已停止的容器
        if (container.state !== 'running') {
          try {
            await this.dockerService.startContainer(container.id);
            this.logger.log(`✅ 已启动: ${container.name}`);
          } catch (error) {
            this.logger.error(`启动 ${container.name} 失败: ${error.message}`);
          }
        } else {
          this.logger.log(`⏭️  跳过已运行的容器: ${container.name}`);
        }
      }
      
      this.logger.log('✅ 所有容器启动操作完成');
    } catch (error) {
      this.logger.error(`启动容器失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 停止所有监控的容器
   */
  private async stopAllContainers() {
    try {
      this.logger.log('⏹️  开始停止所有 *arr 容器...');
      
      const containers = await this.dockerService.listContainers(true);
      
      for (const container of containers) {
        // 只停止运行中的容器
        if (container.state === 'running') {
          try {
            await this.dockerService.stopContainer(container.id);
            this.logger.log(`✅ 已停止: ${container.name}`);
          } catch (error) {
            this.logger.error(`停止 ${container.name} 失败: ${error.message}`);
          }
        } else {
          this.logger.log(`⏭️  跳过已停止的容器: ${container.name}`);
        }
      }
      
      this.logger.log('✅ 所有容器停止操作完成');
    } catch (error) {
      this.logger.error(`停止容器失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 手动触发检查（用于测试或立即检查）
   */
  async triggerCheck() {
    this.logger.log('🔄 手动触发文件夹大小检查...');
    await this.checkFolderSize();
  }

  /**
   * 获取监控状态
   */
  getStatus() {
    return {
      monitorPath: this.monitorPath,
      excludeFolder: this.excludeFolder,
      startThresholdGB: this.startThresholdGB,
      stopThresholdGB: this.stopThresholdGB,
      lastAction: this.lastAction || 'none',
    };
  }
}

