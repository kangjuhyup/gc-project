import { type PaymentResultDto, type PaymentSeat } from './paymentApi';
import type { ReservationDetail } from '@/features/reservations/reservationApi';

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

export interface PaymentCompleteRouteState {
  payment: PaymentResultDto;
  paymentState: PaymentRouteState;
  payments: PaymentResultDto[];
}

export function isPaymentCompleteRouteState(value: unknown): value is PaymentCompleteRouteState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as Partial<PaymentCompleteRouteState>;

  return (
    isPaymentResult(state.payment) &&
    isPaymentRouteState(state.paymentState) &&
    Array.isArray(state.payments) &&
    state.payments.length > 0 &&
    state.payments.every(isPaymentResult)
  );
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString()}원`;
}

export function summarizePaymentCompleteReservations({
  paymentState,
  reservations,
}: {
  paymentState?: PaymentRouteState;
  reservations: ReservationDetail[];
}) {
  const firstReservation = reservations[0];

  if (firstReservation) {
    return {
      movieTitle: firstReservation.movieTitle,
      screeningStartAt: firstReservation.screeningStartAt,
      screenName: firstReservation.screenName,
      seats: uniqueStrings(reservations.flatMap((reservation) => reservation.seats)),
      totalPrice: reservations.reduce(
        (sum, reservation) => sum + (reservation.paymentAmount ?? reservation.totalPrice),
        0,
      ),
      reservationNumbers: reservations.map((reservation) => reservation.reservationNumber),
    };
  }

  return {
    movieTitle: paymentState?.movieTitle,
    screeningStartAt: paymentState?.screeningStartAt,
    screenName: paymentState?.screenName,
    seats: paymentState?.seats.map((seat) => seat.label),
    totalPrice: paymentState?.totalPrice,
    reservationNumbers: [],
  };
}

function isPaymentResult(value: unknown): value is PaymentResultDto {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payment = value as Partial<PaymentResultDto>;

  return (
    typeof payment.paymentId === 'string' &&
    typeof payment.seatHoldId === 'string' &&
    typeof payment.idempotencyKey === 'string' &&
    typeof payment.provider === 'string' &&
    typeof payment.status === 'string' &&
    typeof payment.amount === 'number'
  );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}
