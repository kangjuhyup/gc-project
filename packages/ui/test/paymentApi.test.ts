import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPayment, mapPaymentMethodToProvider } from '@/features/payment/paymentApi';
import { clearStoredAccessToken, setStoredAccessToken } from '@/lib/apiClient';

describe('paymentApi', () => {
  afterEach(() => {
    clearStoredAccessToken();
  });

  it('UI 결제 수단을 OpenAPI provider 값으로 변환한다', () => {
    expect(mapPaymentMethodToProvider('CARD')).toBe('LOCAL');
    expect(mapPaymentMethodToProvider('KAKAO_PAY')).toBe('KAKAO');
    expect(mapPaymentMethodToProvider('NAVER_PAY')).toBe('NAVER');
  });

  it('결제 확인 요청을 OpenAPI 결제 상세 endpoint로 전송한다', async () => {
    setStoredAccessToken('access-token');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          paymentId: '7001',
          seatHoldId: '9001',
          idempotencyKey: 'pay-9001',
          provider: 'LOCAL',
          status: 'APPROVED',
          amount: 15000,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-payment-detail',
    });

    const result = await fetchPayment('7001');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/payments/7001',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer access-token',
          'x-correlation-id': 'correlation-payment-detail',
        }),
      }),
    );
    expect(result.status).toBe('APPROVED');
  });
});
