import {
  Collection,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
  Unique,
} from '@mikro-orm/core';
import { MemberEntity } from './member.entity';
import { ReservationEventEntity } from './reservation-event.entity';
import { ReservationSeatEntity } from './reservation-seat.entity';
import { ScreeningEntity } from './screening.entity';
import { SeatHoldEntity } from './seat-hold.entity';

@Entity({ tableName: 'reservation' })
@Unique({ name: 'uq_reservation_number', properties: ['reservationNumber'] })
@Index({ name: 'idx_reservation_member_created', properties: ['member', 'createdAt'] })
@Index({ name: 'idx_reservation_member_status', properties: ['member', 'status', 'createdAt'] })
export class ReservationEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property({ length: 20 })
  reservationNumber!: string;

  @ManyToOne({ entity: () => MemberEntity, fieldName: 'member_id' })
  member!: Rel<MemberEntity>;

  @ManyToOne({ entity: () => ScreeningEntity, fieldName: 'screening_id' })
  screening!: Rel<ScreeningEntity>;

  @Property({ length: 20 })
  status!: string;

  @Property()
  totalPrice!: number;

  @Property({ columnType: 'timestamptz', nullable: true })
  canceledAt?: Date;

  @Property({ length: 100, nullable: true })
  cancelReason?: string;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @OneToMany(() => ReservationSeatEntity, (reservationSeat) => reservationSeat.reservation)
  reservationSeats = new Collection<ReservationSeatEntity>(this);

  @OneToMany(() => ReservationEventEntity, (event) => event.reservation)
  events = new Collection<ReservationEventEntity>(this);

  @OneToMany(() => SeatHoldEntity, (seatHold) => seatHold.reservation)
  seatHolds = new Collection<SeatHoldEntity>(this);
}
