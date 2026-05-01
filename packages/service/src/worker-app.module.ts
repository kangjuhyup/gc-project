import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import { Module } from '@nestjs/common';
import { resolveLogLevel, ServiceConfigModule } from '@infrastructure/config';
import { OutboxWorkerModule } from '@infrastructure/outbox';

@Module({
  imports: [
    ServiceConfigModule.forWorker(),
    RvlogNestModule.forRoot({
      logger: {
        minLevel: resolveLogLevel(process.env.LOG_LEVEL, LogLevel.WARN),
        pretty: true,
      },
    }),
    OutboxWorkerModule,
  ],
})
export class WorkerAppModule {}
