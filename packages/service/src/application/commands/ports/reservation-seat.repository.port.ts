import type { ReservationSeatModel } from '../../../domain';
import type { RepositoryPort } from './repository.port';

export interface ReservationSeatRepositoryPort extends RepositoryPort<ReservationSeatModel> {
  findByScreeningAndSeat(screeningId: string, seatId: string): Promise<ReservationSeatModel | undefined>;
}
