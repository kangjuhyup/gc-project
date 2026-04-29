import type { ReservationSeatModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const RESERVATION_SEAT_REPOSITORY = Symbol('RESERVATION_SEAT_REPOSITORY');

export interface ReservationSeatRepositoryPort extends RepositoryPort<ReservationSeatModel> {
  findByScreeningAndSeat(screeningId: string, seatId: string): Promise<ReservationSeatModel | undefined>;
}
