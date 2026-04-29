import type { OutboxEventModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const OUTBOX_EVENT_REPOSITORY = Symbol('OUTBOX_EVENT_REPOSITORY');

export interface OutboxEventRepositoryPort extends RepositoryPort<OutboxEventModel> {
  findPublishable(params: { now: Date; limit: number }): Promise<OutboxEventModel[]>;
}
