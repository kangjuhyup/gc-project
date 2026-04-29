import { type PaymentSeat } from './paymentApi';

export interface PaymentRouteState {
  movieTitle: string;
  screenName: string;
  screeningId: string;
  screeningStartAt: string;
  seats: PaymentSeat[];
  seatHoldIds: string[];
  totalPrice: number;
}

export function isPaymentRouteState(value: unknown): value is PaymentRouteState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as Partial<PaymentRouteState>;

  return (
    typeof state.movieTitle === 'string' &&
    typeof state.screenName === 'string' &&
    typeof state.screeningId === 'string' &&
    typeof state.screeningStartAt === 'string' &&
    Array.isArray(state.seats) &&
    Array.isArray(state.seatHoldIds) &&
    state.seats.length > 0 &&
    state.seatHoldIds.length === state.seats.length &&
    state.seats.every(
      (seat) =>
        Boolean(seat) &&
        typeof seat === 'object' &&
        typeof seat.id === 'string' &&
        typeof seat.label === 'string',
    ) &&
    state.seatHoldIds.every((seatHoldId) => typeof seatHoldId === 'string') &&
    typeof state.totalPrice === 'number'
  );
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString()}원`;
}
