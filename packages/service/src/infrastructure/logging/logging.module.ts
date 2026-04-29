import { Module } from '@nestjs/common';
import { LOG_EVENT_PUBLISHER } from '@application/commands/ports';
import { NestLogEventPublisher } from './nest-log-event-publisher';

@Module({
  providers: [
    NestLogEventPublisher,
    {
      provide: LOG_EVENT_PUBLISHER,
      useExisting: NestLogEventPublisher,
    },
  ],
  exports: [LOG_EVENT_PUBLISHER],
})
export class LoggingModule {}
