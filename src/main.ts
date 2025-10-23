import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 启用CORS
  app.enableCors();

  const port = process.env.PORT || 8011;
  await app.listen(port);
  logger.log(`🚀 Docker控制器运行在: http://localhost:${port}`);
  logger.log(`📊 访问Web界面: http://localhost:${port}`);
}

bootstrap();

