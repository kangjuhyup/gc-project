export const ReservationEventType = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
} as const;

export type ReservationEventType = (typeof ReservationEventType)[keyof typeof ReservationEventType];
