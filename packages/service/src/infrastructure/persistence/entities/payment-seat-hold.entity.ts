import { Entity, Index, ManyToOne, PrimaryKey, Rel, Unique } from '@mikro-orm/core';
import { PaymentEntity } from './payment.entity';
import { SeatHoldEntity } from './seat-hold.entity';

@Entity({ tableName: 'payment_seat_hold' })
@Index({ name: 'idx_payment_seat_hold_payment', properties: ['payment'] })
@Index({ name: 'idx_payment_seat_hold_seat_hold', properties: ['seatHold'] })
@Unique({ name: 'uq_payment_seat_hold_payment_hold', properties: ['payment', 'seatHold'] })
export class PaymentSeatHoldEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => PaymentEntity, fieldName: 'payment_id' })
  payment!: Rel<PaymentEntity>;

  @ManyToOne({ entity: () => SeatHoldEntity, fieldName: 'seat_hold_id' })
  seatHold!: Rel<SeatHoldEntity>;
}
