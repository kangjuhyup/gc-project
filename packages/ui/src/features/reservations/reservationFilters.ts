import { type ReservationSummary } from './reservationApi';

export type ReservationView = 'UPCOMING' | 'COMPLETED' | 'CANCELED';
export const DEFAULT_RESERVATION_CANCEL_REASON = '사용자 요청';

export function filterReservations(
  reservations: ReservationSummary[],
  view: ReservationView,
  now = new Date(),
) {
  return reservations.filter((reservation) => {
    if (view === 'CANCELED') {
      return reservation.status === 'CANCELED' || reservation.status === 'EXPIRED';
    }

    if (reservation.status !== 'CONFIRMED') {
      return false;
    }

    const screeningStartAt = new Date(reservation.screeningStartAt);

    if (view === 'UPCOMING') {
      return screeningStartAt > now;
    }

    return screeningStartAt <= now;
  });
}

export function getReservationViewLabel(view: ReservationView) {
  const labels: Record<ReservationView, string> = {
    UPCOMING: '관람 예정',
    COMPLETED: '관람 완료',
    CANCELED: '취소',
  };

  return labels[view];
}

export function canCancelReservation(reservation: ReservationSummary, now = new Date()) {
  return reservation.status === 'CONFIRMED' && new Date(reservation.screeningStartAt) > now;
}
