import { Logging } from '@kangjuhyup/rvlog';
import { assertDefined } from '@application/assertions';
import { GetMyReservationQuery, ReservationDetailDto } from '../dto';
import type { ReservationQueryPort } from '../ports';

@Logging
export class GetMyReservationQueryHandler {
  constructor(private readonly reservationQuery: ReservationQueryPort) {}

  async execute(query: GetMyReservationQuery): Promise<ReservationDetailDto> {
    const reservation = await this.reservationQuery.getMyReservation(query);
    assertDefined(reservation, () => new Error('RESERVATION_NOT_FOUND'));

    return reservation;
  }
}
