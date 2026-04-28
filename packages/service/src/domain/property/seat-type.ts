export const SeatType = {
  NORMAL: 'NORMAL',
  COUPLE: 'COUPLE',
  DISABLED: 'DISABLED',
} as const;

export type SeatType = (typeof SeatType)[keyof typeof SeatType];
