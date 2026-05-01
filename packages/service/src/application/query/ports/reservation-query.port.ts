import type { GetMyReservationQuery, ListMyReservationsQuery, ReservationDetailDto, ReservationListResultDto } from '../dto';

export const RESERVATION_QUERY = Symbol('RESERVATION_QUERY');

export interface ReservationQueryPort {
  listMyReservations(query: ListMyReservationsQuery): Promise<ReservationListResultDto>;
  getMyReservation(query: GetMyReservationQuery): Promise<ReservationDetailDto | undefined>;
}
