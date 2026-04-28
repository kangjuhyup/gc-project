import { Injectable, Logger } from '@nestjs/common';
import type { DomainEvent } from '@domain';
import type { LogEventPublisherPort } from '@application/commands/ports';

@Injectable()
export class NestLogEventPublisher implements LogEventPublisherPort {
  private readonly logger = new Logger(NestLogEventPublisher.name);

  async publish(event: DomainEvent): Promise<void> {
    this.logger.log(JSON.stringify(event));
  }
}
