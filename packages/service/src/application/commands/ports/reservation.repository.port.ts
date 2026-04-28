import type { ReservationModel } from '../../../domain';
import type { RepositoryPort } from './repository.port';

export interface ReservationRepositoryPort extends RepositoryPort<ReservationModel> {
  findByReservationNumber(reservationNumber: string): Promise<ReservationModel | null>;
}
