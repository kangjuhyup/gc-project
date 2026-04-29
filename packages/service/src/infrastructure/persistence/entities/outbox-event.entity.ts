import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'outbox_event' })
@Index({ name: 'idx_outbox_publishable', properties: ['status', 'nextRetryAt', 'occurredAt'] })
@Index({ name: 'idx_outbox_aggregate', properties: ['aggregateType', 'aggregateId'] })
export class OutboxEventEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property({ length: 50 })
  aggregateType!: string;

  @Property({ length: 50 })
  aggregateId!: string;

  @Property({ length: 80 })
  eventType!: string;

  @Property({ columnType: 'jsonb' })
  payload!: Record<string, unknown>;

  @Property({ length: 20 })
  status!: string;

  @Property()
  retryCount!: number;

  @Property({ columnType: 'timestamptz', nullable: true })
  nextRetryAt?: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  lockedUntil?: Date;

  @Property({ length: 500, nullable: true })
  lastError?: string;

  @Property({ columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
