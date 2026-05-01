import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import { Module } from '@nestjs/common';
import { ServiceConfigModule } from '@infrastructure/config';
import { OutboxWorkerModule } from '@infrastructure/outbox';

@Module({
  imports: [
    ServiceConfigModule.forWorker(),
    RvlogNestModule.forRoot({
      logger: {
        minLevel: LogLevel.WARN,
        pretty: true,
      },
    }),
    OutboxWorkerModule,
  ],
})
export class WorkerAppModule {}
