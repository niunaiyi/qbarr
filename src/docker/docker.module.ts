import { Module } from '@nestjs/common';
import { DockerController } from './docker.controller';
import { DockerService } from './docker.service';

@Module({
  controllers: [DockerController],
  providers: [DockerService],
  exports: [DockerService], // 导出以便其他模块使用
})
export class DockerModule {}

