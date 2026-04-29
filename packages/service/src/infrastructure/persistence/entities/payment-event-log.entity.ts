import { Entity, Index, ManyToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { PaymentEntity } from './payment.entity';

@Entity({ tableName: 'payment_event_log' })
@Index({ name: 'idx_payment_event_log_payment_created', properties: ['payment', 'createdAt'] })
export class PaymentEventLogEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => PaymentEntity, fieldName: 'payment_id' })
  payment!: Rel<PaymentEntity>;

  @Property({ length: 50 })
  eventType!: string;

  @Property({ length: 30, nullable: true })
  previousStatus?: string;

  @Property({ length: 30 })
  nextStatus!: string;

  @Property({ length: 20 })
  provider!: string;

  @Property({ length: 100, nullable: true })
  providerPaymentId?: string;

  @Property()
  amount!: number;

  @Property({ length: 255, nullable: true })
  reason?: string;

  @Property({ columnType: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();
}
