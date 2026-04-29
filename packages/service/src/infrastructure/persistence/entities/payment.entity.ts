import { Entity, Index, ManyToOne, PrimaryKey, Property, Rel, Unique } from '@mikro-orm/core';
import { MemberEntity } from './member.entity';
import { ReservationEntity } from './reservation.entity';
import { SeatHoldEntity } from './seat-hold.entity';

@Entity({ tableName: 'payment' })
@Index({ name: 'idx_payment_member_created', properties: ['member', 'createdAt'] })
@Index({ name: 'idx_payment_seat_hold', properties: ['seatHold'] })
@Unique({ name: 'uq_payment_member_idempotency_key', properties: ['member', 'idempotencyKey'] })
@Unique({ name: 'uq_payment_provider_payment_id', properties: ['provider', 'providerPaymentId'] })
export class PaymentEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => MemberEntity, fieldName: 'member_id' })
  member!: Rel<MemberEntity>;

  @ManyToOne({ entity: () => SeatHoldEntity, fieldName: 'seat_hold_id' })
  seatHold!: Rel<SeatHoldEntity>;

  @Property({ fieldName: 'idempotency_key', length: 100 })
  idempotencyKey!: string;

  @ManyToOne({ entity: () => ReservationEntity, fieldName: 'reservation_id', nullable: true })
  reservation?: Rel<ReservationEntity>;

  @Property({ length: 20 })
  provider!: string;

  @Property({ length: 100, nullable: true })
  providerPaymentId?: string;

  @Property()
  amount!: number;

  @Property({ length: 30 })
  status!: string;

  @Property({ columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  failedAt?: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  refundedAt?: Date;

  @Property({ length: 255, nullable: true })
  failureReason?: string;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
