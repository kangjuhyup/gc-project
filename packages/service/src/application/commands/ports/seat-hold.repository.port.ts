import type { SeatHoldModel } from '../../../domain';
import type { RepositoryPort } from './repository.port';

export interface SeatHoldRepositoryPort extends RepositoryPort<SeatHoldModel> {
  findActiveHold(screeningId: string, seatId: string): Promise<SeatHoldModel | null>;
}
