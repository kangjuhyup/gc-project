import type { SeatModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export interface SeatRepositoryPort extends RepositoryPort<SeatModel> {
  findByScreenAndPosition(screenId: string, seatRow: string, seatCol: number): Promise<SeatModel | undefined>;
}
