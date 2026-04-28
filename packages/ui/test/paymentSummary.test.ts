import { describe, expect, it } from 'vitest';
import { formatCurrency, isPaymentRouteState } from '@/features/payment/paymentSummary';

describe('paymentSummary', () => {
  it('결제 라우트 state 구조가 올바른지 검증한다', () => {
    expect(
      isPaymentRouteState({
        movieTitle: '파묘',
        screenName: '1관',
        screeningId: 101,
        screeningStartAt: '2026-04-28T10:30:00+09:00',
        seats: [{ id: 1, label: 'A1' }],
        totalPrice: 14000,
      }),
    ).toBe(true);
    expect(isPaymentRouteState({ seats: [] })).toBe(false);
  });

  it('금액을 원화 라벨로 포맷한다', () => {
    expect(formatCurrency(28000)).toBe('28,000원');
  });
});
