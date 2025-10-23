import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { DockerModule } from './docker/docker.module';
import { MonitorModule } from './monitor/monitor.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    ScheduleModule.forRoot(), // 启用定时任务
    DockerModule,
    MonitorModule,
  ],
})
export class AppModule {}

