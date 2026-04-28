import { type PaymentSeat } from './paymentApi';

export interface PaymentRouteState {
  movieTitle: string;
  screenName: string;
  screeningId: number;
  screeningStartAt: string;
  seats: PaymentSeat[];
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
    typeof state.screeningId === 'number' &&
    typeof state.screeningStartAt === 'string' &&
    Array.isArray(state.seats) &&
    state.seats.length > 0 &&
    state.seats.every(
      (seat) =>
        Boolean(seat) &&
        typeof seat === 'object' &&
        typeof seat.id === 'number' &&
        typeof seat.label === 'string',
    ) &&
    typeof state.totalPrice === 'number'
  );
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString()}원`;
}
