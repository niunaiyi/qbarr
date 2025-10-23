import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DockerService } from './docker.service';

@Controller('api/docker')
export class DockerController {
  constructor(private readonly dockerService: DockerService) {}

  @Get('containers')
  async listContainers(@Query('all') all?: string) {
    const showAll = all === 'true';
    const containers = await this.dockerService.listContainers(showAll);
    return {
      success: true,
      count: containers.length,
      containers,
    };
  }

  @Get('containers/:id')
  async getContainer(@Param('id') id: string) {
    const container = await this.dockerService.getContainer(id);
    return {
      success: true,
      container,
    };
  }

  @Post('containers/:id/start')
  @HttpCode(HttpStatus.OK)
  async startContainer(@Param('id') id: string) {
    const result = await this.dockerService.startContainer(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post('containers/:id/stop')
  @HttpCode(HttpStatus.OK)
  async stopContainer(
    @Param('id') id: string,
    @Body() body?: { timeout?: number },
  ) {
    const timeout = body?.timeout || 10;
    const result = await this.dockerService.stopContainer(id, timeout);
    return {
      success: true,
      ...result,
    };
  }

  @Post('containers/:id/restart')
  @HttpCode(HttpStatus.OK)
  async restartContainer(
    @Param('id') id: string,
    @Body() body?: { timeout?: number },
  ) {
    const timeout = body?.timeout || 10;
    const result = await this.dockerService.restartContainer(id, timeout);
    return {
      success: true,
      ...result,
    };
  }

  @Post('containers/:id/pause')
  @HttpCode(HttpStatus.OK)
  async pauseContainer(@Param('id') id: string) {
    const result = await this.dockerService.pauseContainer(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post('containers/:id/unpause')
  @HttpCode(HttpStatus.OK)
  async unpauseContainer(@Param('id') id: string) {
    const result = await this.dockerService.unpauseContainer(id);
    return {
      success: true,
      ...result,
    };
  }

  @Delete('containers/:id')
  async removeContainer(
    @Param('id') id: string,
    @Query('force') force?: string,
  ) {
    const forceRemove = force === 'true';
    const result = await this.dockerService.removeContainer(id, forceRemove);
    return {
      success: true,
      ...result,
    };
  }

  @Get('images')
  async listImages() {
    const images = await this.dockerService.listImages();
    return {
      success: true,
      count: images.length,
      images,
    };
  }

  @Get('info')
  async getDockerInfo() {
    const info = await this.dockerService.getDockerInfo();
    return {
      success: true,
      info,
    };
  }

  @Get('health')
  async healthCheck() {
    const health = await this.dockerService.healthCheck();
    return {
      success: health.dockerConnected,
      ...health,
    };
  }
}

