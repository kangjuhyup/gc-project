export const SEAT_HOLD_LOCK = Symbol('SEAT_HOLD_LOCK');

export interface SeatHoldLock {
  readonly screeningId: string;
  readonly seatIds: string[];
  readonly token: string;
}

export interface SeatHoldLockPort {
  acquire(params: {
    screeningId: string;
    seatIds: string[];
    ttlMilliseconds: number;
  }): Promise<SeatHoldLock | undefined>;
  release(lock: SeatHoldLock): Promise<void>;
}
