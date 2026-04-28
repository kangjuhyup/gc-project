import type { DomainEvent } from '@domain';

export const LOG_EVENT_PUBLISHER = Symbol('LOG_EVENT_PUBLISHER');

export interface LogEventPublisherPort {
  publish(event: DomainEvent): Promise<void>;
}
