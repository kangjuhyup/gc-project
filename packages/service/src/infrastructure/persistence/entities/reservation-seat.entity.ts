import { Entity, ManyToOne, PrimaryKey, Rel, Unique } from '@mikro-orm/core';
import { ReservationEntity } from './reservation.entity';
import { ScreeningEntity } from './screening.entity';
import { SeatEntity } from './seat.entity';

@Entity({ tableName: 'reservation_seat' })
@Unique({ name: 'uq_reservation_seat_screening_seat', properties: ['screening', 'seat'] })
export class ReservationSeatEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => ReservationEntity, fieldName: 'reservation_id' })
  reservation!: Rel<ReservationEntity>;

  @ManyToOne({ entity: () => ScreeningEntity, fieldName: 'screening_id' })
  screening!: Rel<ScreeningEntity>;

  @ManyToOne({ entity: () => SeatEntity, fieldName: 'seat_id' })
  seat!: Rel<SeatEntity>;
}
