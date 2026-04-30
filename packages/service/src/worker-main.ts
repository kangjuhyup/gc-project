import { type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerAppModule } from './worker-app.module';

export async function bootstrapWorker(): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(WorkerAppModule, {
    logger: ['warn', 'error'],
  });
}

if (require.main === module) {
  void bootstrapWorker();
}
