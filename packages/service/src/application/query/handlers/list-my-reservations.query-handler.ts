import { Logging } from '@kangjuhyup/rvlog';
import type { ReservationListResultDto } from '../dto';
import { ListMyReservationsQuery } from '../dto';
import type { ReservationQueryPort } from '../ports';

@Logging
export class ListMyReservationsQueryHandler {
  constructor(private readonly reservationQuery: ReservationQueryPort) {}

  execute(query: ListMyReservationsQuery): Promise<ReservationListResultDto> {
    return this.reservationQuery.listMyReservations(query);
  }
}
