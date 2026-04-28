export const SeatHoldStatus = {
  HELD: 'HELD',
  CONFIRMED: 'CONFIRMED',
  EXPIRED: 'EXPIRED',
  RELEASED: 'RELEASED',
} as const;

export type SeatHoldStatus = (typeof SeatHoldStatus)[keyof typeof SeatHoldStatus];
