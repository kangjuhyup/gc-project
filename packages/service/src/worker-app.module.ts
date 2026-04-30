import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OutboxWorkerModule } from '@infrastructure/outbox';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env-worker',
      isGlobal: true,
    }),
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
