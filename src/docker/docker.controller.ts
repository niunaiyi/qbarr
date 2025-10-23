import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
  async stopContainer(@Param('id') id: string) {
    const result = await this.dockerService.stopContainer(id);
    return {
      success: true,
      ...result,
    };
  }

}

