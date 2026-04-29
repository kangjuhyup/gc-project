import type { SeatHoldModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const SEAT_HOLD_REPOSITORY = Symbol('SEAT_HOLD_REPOSITORY');

export interface SeatHoldRepositoryPort extends RepositoryPort<SeatHoldModel> {
  saveMany(models: SeatHoldModel[]): Promise<SeatHoldModel[]>;
  findActiveHold(screeningId: string, seatId: string): Promise<SeatHoldModel | undefined>;
  findUnavailableSeatIds(params: {
    screeningId: string;
    seatIds: string[];
    now: Date;
  }): Promise<string[]>;
  findSeatIdsInScreening(params: {
    screeningId: string;
    seatIds: string[];
  }): Promise<string[]>;
}
