export const SeatAvailabilityStatus = {
  AVAILABLE: 'AVAILABLE',
  HELD: 'HELD',
  RESERVED: 'RESERVED',
} as const;

export type SeatAvailabilityStatus =
  (typeof SeatAvailabilityStatus)[keyof typeof SeatAvailabilityStatus];
