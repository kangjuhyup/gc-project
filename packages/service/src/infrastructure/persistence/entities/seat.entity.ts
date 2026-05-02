import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
  Unique,
} from '@mikro-orm/core';
import { ReservationSeatEntity } from './reservation-seat.entity';
import { ScreenEntity } from './screen.entity';
import { SeatHoldEntity } from './seat-hold.entity';

@Entity({ tableName: 'seat' })
@Unique({ name: 'uq_seat_screen_row_col', properties: ['screen', 'seatRow', 'seatCol'] })
export class SeatEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => ScreenEntity, fieldName: 'screen_id' })
  screen!: Rel<ScreenEntity>;

  @Property({ length: 5 })
  seatRow!: string;

  @Property()
  seatCol!: number;

  @Property({ length: 20, nullable: true })
  seatType?: string;

  @OneToMany(() => ReservationSeatEntity, (reservationSeat) => reservationSeat.seat)
  reservationSeats = new Collection<ReservationSeatEntity>(this);

  @OneToMany(() => SeatHoldEntity, (seatHold) => seatHold.seat)
  seatHolds = new Collection<SeatHoldEntity>(this);
}
