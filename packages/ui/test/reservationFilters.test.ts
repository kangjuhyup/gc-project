import { describe, expect, it } from 'vitest';
import { filterReservations } from '@/features/reservations/reservationFilters';
import { type ReservationSummary } from '@/features/reservations/reservationApi';

const baseReservation: ReservationSummary = {
  id: 1,
  reservationNumber: 'R20260428001',
  status: 'CONFIRMED',
  totalPrice: 28000,
  createdAt: '2026-04-28T09:00:00+09:00',
  movieTitle: '파묘',
  posterUrl: '',
  screeningStartAt: '2026-04-29T10:30:00+09:00',
  screenName: '1관',
  seats: ['A1', 'A2'],
};

describe('reservationFilters', () => {
  it('groups confirmed future reservations as upcoming', () => {
    expect(
      filterReservations([baseReservation], 'UPCOMING', new Date('2026-04-28T10:00:00+09:00')),
    ).toHaveLength(1);
  });

  it('groups confirmed past reservations as completed', () => {
    expect(
      filterReservations([baseReservation], 'COMPLETED', new Date('2026-04-30T10:00:00+09:00')),
    ).toHaveLength(1);
  });

  it('groups canceled and expired reservations together', () => {
    expect(
      filterReservations(
        [
          { ...baseReservation, id: 2, status: 'CANCELED' },
          { ...baseReservation, id: 3, status: 'EXPIRED' },
        ],
        'CANCELED',
      ),
    ).toHaveLength(2);
  });
});
