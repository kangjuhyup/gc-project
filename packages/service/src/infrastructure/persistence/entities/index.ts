export { MemberEntity } from './member.entity';
export { MovieEntity } from './movie.entity';
export { ReservationEntity } from './reservation.entity';
export { ReservationEventEntity } from './reservation-event.entity';
export { ReservationSeatEntity } from './reservation-seat.entity';
export { ScreenEntity } from './screen.entity';
export { ScreeningEntity } from './screening.entity';
export { SeatEntity } from './seat.entity';
export { SeatHoldEntity } from './seat-hold.entity';

import { MemberEntity } from './member.entity';
import { MovieEntity } from './movie.entity';
import { ReservationEntity } from './reservation.entity';
import { ReservationEventEntity } from './reservation-event.entity';
import { ReservationSeatEntity } from './reservation-seat.entity';
import { ScreenEntity } from './screen.entity';
import { ScreeningEntity } from './screening.entity';
import { SeatEntity } from './seat.entity';
import { SeatHoldEntity } from './seat-hold.entity';

export const persistenceEntities = [
  MemberEntity,
  MovieEntity,
  ReservationEntity,
  ReservationEventEntity,
  ReservationSeatEntity,
  ScreenEntity,
  ScreeningEntity,
  SeatEntity,
  SeatHoldEntity,
];
