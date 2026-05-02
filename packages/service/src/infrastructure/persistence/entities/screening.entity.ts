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
import { MovieEntity } from './movie.entity';
import { ReservationEntity } from './reservation.entity';
import { ReservationSeatEntity } from './reservation-seat.entity';
import { ScreenEntity } from './screen.entity';
import { SeatHoldEntity } from './seat-hold.entity';

@Entity({ tableName: 'screening' })
@Index({ name: 'idx_screening_movie_start', properties: ['movie', 'startAt'] })
@Index({ name: 'idx_screening_screen_start', properties: ['screen', 'startAt'] })
@Unique({ name: 'uq_screening_screen_start', properties: ['screen', 'startAt'] })
export class ScreeningEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => MovieEntity, fieldName: 'movie_id' })
  movie!: Rel<MovieEntity>;

  @ManyToOne({ entity: () => ScreenEntity, fieldName: 'screen_id' })
  screen!: Rel<ScreenEntity>;

  @Property({ columnType: 'timestamptz' })
  startAt!: Date;

  @Property({ columnType: 'timestamptz' })
  endAt!: Date;

  @Property()
  price!: number;

  @OneToMany(() => ReservationEntity, (reservation) => reservation.screening)
  reservations = new Collection<ReservationEntity>(this);

  @OneToMany(() => ReservationSeatEntity, (reservationSeat) => reservationSeat.screening)
  reservationSeats = new Collection<ReservationSeatEntity>(this);

  @OneToMany(() => SeatHoldEntity, (seatHold) => seatHold.screening)
  seatHolds = new Collection<SeatHoldEntity>(this);
}
