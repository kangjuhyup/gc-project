import type { SeatHoldModel } from '@domain';

export const SEAT_HOLD_CACHE = Symbol('SEAT_HOLD_CACHE');

export interface SeatHoldCachePort {
  hold(model: SeatHoldModel, ttlSeconds: number): Promise<boolean>;
  release(screeningId: string, seatId: string): Promise<void>;
}
