import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPaymentIdempotencyKey,
  fetchPayment,
  mapPaymentMethodToProvider,
  requestPayment,
} from '@/features/payment/paymentApi';
import { clearStoredAccessToken, setStoredAccessToken } from '@/lib/apiClient';

describe('paymentApi', () => {
  afterEach(() => {
    clearStoredAccessToken();
    vi.unstubAllGlobals();
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

  it('여러 좌석 결제 요청을 단일 OpenAPI 결제 요청으로 전송한다', async () => {
    setStoredAccessToken('access-token');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          paymentId: '7001',
          seatHoldId: '9001',
          seatHoldIds: ['9001', '9002', '9003'],
          idempotencyKey: 'pay-9001-9002-9003',
          provider: 'LOCAL',
          status: 'PENDING',
          amount: 45000,
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-payment-request',
    });

    const result = await requestPayment({
      seatHoldIds: ['9001', '9002', '9003'],
      idempotencyKey: 'pay-9001-9002-9003',
      provider: 'LOCAL',
      amount: 45000,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/payments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          seatHoldIds: ['9001', '9002', '9003'],
          idempotencyKey: 'pay-9001-9002-9003',
          provider: 'LOCAL',
          amount: 45000,
        }),
      }),
    );
    expect(result.seatHoldIds).toEqual(['9001', '9002', '9003']);
  });

  it('결제 멱등성 키는 여러 좌석 점유 ID를 포함해서 생성한다', () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => 'payment-uuid',
    });

    expect(createPaymentIdempotencyKey(['9001', '9002', '9003'])).toBe('pay-9001-9002-9003-payment-uuid');
  });
});
