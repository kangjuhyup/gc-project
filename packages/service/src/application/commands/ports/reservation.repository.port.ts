import type { ReservationModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const RESERVATION_REPOSITORY = Symbol('RESERVATION_REPOSITORY');

export interface ReservationRepositoryPort extends RepositoryPort<ReservationModel> {
  findByReservationNumber(reservationNumber: string): Promise<ReservationModel | undefined>;
}
