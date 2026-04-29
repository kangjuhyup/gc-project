import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalPaymentCallbackVerifier, LocalPaymentGateway } from '@infrastructure/payment';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('LocalPaymentGateway', () => {
  it('로컬 결제 요청 시 callback에 필요한 provider payment id와 token이 담긴 URL을 반환한다', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(undefined, { status: 201 })));
    const gateway = new LocalPaymentGateway();

    const result = await gateway.request({
      paymentId: '7001',
      amount: 15000,
    });

    expect(result.provider).toBe('LOCAL');
    expect(result.providerPaymentId).toBe('local-payment-7001');
    expect(result.approvalUrl).toContain('paymentId=7001');
    expect(result.approvalUrl).toContain('providerPaymentId=local-payment-7001');
    expect(result.approvalUrl).toContain('token=local:7001:local-payment-7001');
    expect(result.expiresAt).toBeInstanceOf(Date);
    await vi.runAllTimersAsync();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/payments/callback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          provider: 'LOCAL',
          providerPaymentId: 'local-payment-7001',
          paymentId: '7001',
          amount: 15000,
          approved: true,
          token: 'local:7001:local-payment-7001',
        }),
      }),
    );
  });

  it('로컬 결제 환불은 LOCAL provider 요청만 성공으로 처리한다', async () => {
    const gateway = new LocalPaymentGateway();

    await expect(
      gateway.refund({
        paymentId: '7001',
        provider: 'LOCAL',
        providerPaymentId: 'local-payment-7001',
        amount: 15000,
      }),
    ).resolves.toEqual({ refunded: true });
  });
});

describe('LocalPaymentCallbackVerifier', () => {
  it('LOCAL provider와 local token prefix가 맞으면 callback 검증을 통과한다', () => {
    const verifier = new LocalPaymentCallbackVerifier();

    expect(verifier.verify({ provider: 'LOCAL', token: 'local:7001:local-payment-7001' })).toBe(true);
  });

  it('provider나 token prefix가 다르면 callback 검증을 거부한다', () => {
    const verifier = new LocalPaymentCallbackVerifier();

    expect(verifier.verify({ provider: 'KAKAO', token: 'local:7001:local-payment-7001' })).toBe(false);
    expect(verifier.verify({ provider: 'LOCAL', token: 'invalid-token' })).toBe(false);
  });
});
