import { describe, expect, it, vi } from 'vitest';
import { GetPaymentQuery, PaymentResultDto } from '@application';
import { GetPaymentQueryHandler } from '@application/query/handlers';
import type { PaymentQueryPort } from '@application/query/ports';

describe('GetPaymentQueryHandler', () => {
  it('결제 상세 조회를 payment query port에 위임한다', async () => {
    const payment = PaymentResultDto.of({
      paymentId: '7001',
      seatHoldId: '9001',
      idempotencyKey: 'pay-test-key',
      provider: 'LOCAL',
      status: 'PENDING',
      amount: 15000,
    });
    const paymentQuery: PaymentQueryPort = {
      findPaymentById: vi.fn(async () => payment),
    };
    const handler = new GetPaymentQueryHandler(paymentQuery);

    const result = await handler.execute(GetPaymentQuery.of({ paymentId: '7001', memberId: '1' }));

    expect(paymentQuery.findPaymentById).toHaveBeenCalledWith({ paymentId: '7001', memberId: '1' });
    expect(result).toBe(payment);
  });

  it('본인 결제 내역을 찾지 못하면 명시적인 에러를 던진다', async () => {
    const paymentQuery: PaymentQueryPort = {
      findPaymentById: vi.fn(async () => undefined),
    };
    const handler = new GetPaymentQueryHandler(paymentQuery);

    await expect(
      handler.execute(GetPaymentQuery.of({ paymentId: '7001', memberId: '1' })),
    ).rejects.toThrow('PAYMENT_NOT_FOUND');
  });
});
