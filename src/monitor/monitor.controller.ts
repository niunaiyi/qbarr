import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { MonitorService } from './monitor.service';

@Controller('api/monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get('status')
  getStatus() {
    const status = this.monitorService.getStatus();
    return {
      success: true,
      status,
    };
  }

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerCheck() {
    await this.monitorService.triggerCheck();
    return {
      success: true,
      message: '已触发文件夹大小检查',
    };
  }
}

