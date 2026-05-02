import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  isPaymentCompleteRouteState,
  isPaymentRouteState,
  summarizePaymentCompleteReservations,
} from '@/features/payment/paymentSummary';
import type { ReservationDetail } from '@/features/reservations/reservationApi';

describe('paymentSummary', () => {
  it('결제 라우트 state 구조가 올바른지 검증한다', () => {
    expect(
      isPaymentRouteState({
        movieTitle: '파묘',
        screenName: '1관',
        screeningId: '101',
        screeningStartAt: '2026-04-28T10:30:00+09:00',
        seats: [{ id: '1', label: 'A1' }],
        seatHoldIds: ['9001'],
        totalPrice: 14000,
      }),
    ).toBe(true);
    expect(
      isPaymentRouteState({
        movieTitle: '파묘',
        screenName: '1관',
        screeningId: '101',
        screeningStartAt: '2026-04-28T10:30:00+09:00',
        seats: [{ id: '1', label: 'A1' }],
        seatHoldIds: [],
        totalPrice: 14000,
      }),
    ).toBe(false);
    expect(isPaymentRouteState({ seats: [] })).toBe(false);
  });

  it('금액을 원화 라벨로 포맷한다', () => {
    expect(formatCurrency(28000)).toBe('28,000원');
  });

  it('결제 완료 라우트 state 구조가 올바른지 검증한다', () => {
    const paymentState = {
      movieTitle: '파묘',
      screenName: '1관',
      screeningId: '101',
      screeningStartAt: '2026-04-28T10:30:00+09:00',
      seats: [{ id: '1', label: 'A1' }],
      seatHoldIds: ['9001'],
      totalPrice: 14000,
    };
    const payment = {
      amount: 14000,
      idempotencyKey: 'pay-9001',
      paymentId: '7001',
      provider: 'LOCAL' as const,
      reservationId: '5001',
      seatHoldId: '9001',
      status: 'APPROVED' as const,
    };

    expect(isPaymentCompleteRouteState({ payment, payments: [payment], paymentState })).toBe(true);
    expect(isPaymentCompleteRouteState({ payment, payments: [], paymentState })).toBe(false);
  });

  it('여러 예매 상세를 결제 완료 화면 요약으로 합산한다', () => {
    const reservations: ReservationDetail[] = [
      reservationDetail({
        id: '5001',
        reservationNumber: 'R00000000000005001',
        seats: ['A1'],
        paymentAmount: 14000,
      }),
      reservationDetail({
        id: '5002',
        reservationNumber: 'R00000000000005002',
        seats: ['A2'],
        paymentAmount: 14000,
      }),
    ];

    expect(summarizePaymentCompleteReservations({ reservations })).toEqual({
      movieTitle: '파묘',
      screeningStartAt: '2026-04-28T10:30:00+09:00',
      screenName: '1관',
      seats: ['A1', 'A2'],
      totalPrice: 28000,
      reservationNumbers: ['R00000000000005001', 'R00000000000005002'],
    });
  });

  it('예매 상세 조회 전에는 결제 진입 state의 여러 좌석을 완료 화면 요약으로 사용한다', () => {
    const paymentState = {
      movieTitle: '파묘',
      screenName: '1관',
      screeningId: '101',
      screeningStartAt: '2026-04-28T10:30:00+09:00',
      seats: [
        { id: '1', label: 'A1' },
        { id: '2', label: 'A2' },
      ],
      seatHoldIds: ['9001', '9002'],
      totalPrice: 28000,
    };

    expect(summarizePaymentCompleteReservations({ paymentState, reservations: [] })).toEqual({
      movieTitle: '파묘',
      screeningStartAt: '2026-04-28T10:30:00+09:00',
      screenName: '1관',
      seats: ['A1', 'A2'],
      totalPrice: 28000,
      reservationNumbers: [],
    });
  });
});

function reservationDetail(overrides: Partial<ReservationDetail> = {}): ReservationDetail {
  return {
    id: '5001',
    reservationNumber: 'R00000000000005001',
    status: 'CONFIRMED',
    totalPrice: 14000,
    paymentAmount: 14000,
    createdAt: '2026-04-28T10:00:00.000Z',
    movieTitle: '파묘',
    posterUrl: '',
    screeningStartAt: '2026-04-28T10:30:00+09:00',
    screenName: '1관',
    seats: ['A1'],
    ...overrides,
  };
}
