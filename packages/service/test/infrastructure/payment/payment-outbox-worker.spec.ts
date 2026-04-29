import { describe, expect, it, vi } from 'vitest';
import { OutboxEventModel, PaymentModel } from '@domain';
import { PaymentOutboxWorker } from '@infrastructure/payment';
import type {
  ClockPort,
  OutboxEventRepositoryPort,
  PaymentEventLogRepositoryPort,
  PaymentGatewayPort,
  PaymentRepositoryPort,
  TransactionManagerPort,
} from '@application/commands/ports';

const now = new Date('2026-04-29T01:00:00.000Z');
const clock: ClockPort = {
  now: vi.fn(() => now),
};
const transactionManager: TransactionManagerPort = {
  runInTransaction: vi.fn(async (work) => await work()),
};

function paymentRequestedOutbox() {
  return OutboxEventModel.pending({
    aggregateType: 'PAYMENT',
    aggregateId: '7001',
    eventType: 'PAYMENT_REQUESTED',
    payload: { paymentId: '7001' },
    occurredAt: now,
  }).setPersistence('8001', now, now);
}

function refundRequestedOutbox() {
  return OutboxEventModel.pending({
    aggregateType: 'PAYMENT',
    aggregateId: '7001',
    eventType: 'PAYMENT_REFUND_REQUESTED',
    payload: { paymentId: '7001' },
    occurredAt: now,
  }).setPersistence('8002', now, now);
}

describe('PaymentOutboxWorker', () => {
  it('PAYMENT_REQUESTED 아웃박스 이벤트를 local payment gateway 요청으로 발행하고 published 처리한다', async () => {
    const outboxEventRepository = {
      findPublishable: vi.fn(async () => [paymentRequestedOutbox()]),
      save: vi.fn(async (event) => event),
    } as unknown as OutboxEventRepositoryPort;
    const paymentRepository = {
      findById: vi.fn(async () =>
        PaymentModel.request({
          memberId: '1',
          seatHoldId: '9001',
          idempotencyKey: 'pay-test-key',
          provider: 'LOCAL',
          amount: 15000,
          now,
        }).setPersistence('7001', now, now),
      ),
    } as unknown as PaymentRepositoryPort;
    const paymentGateway = {
      request: vi.fn(async () => ({ provider: 'LOCAL' })),
      refund: vi.fn(),
    } as unknown as PaymentGatewayPort;
    const worker = new PaymentOutboxWorker(
      outboxEventRepository,
      paymentRepository,
      { save: vi.fn() } as unknown as PaymentEventLogRepositoryPort,
      paymentGateway,
      transactionManager,
      clock,
    );

    const result = await worker.processOnce();

    expect(result).toEqual({ processed: 1, failed: 0 });
    expect(paymentGateway.request).toHaveBeenCalledWith({
      paymentId: '7001',
      provider: 'LOCAL',
      amount: 15000,
    });
    const savedEvents = vi.mocked(outboxEventRepository.save).mock.calls.map(([event]) => event);
    expect(savedEvents.some((event) => event.status === 'PUBLISHED')).toBe(true);
  });

  it('PAYMENT_REFUND_REQUESTED 아웃박스 이벤트를 환불 처리하고 결제 이벤트 로그를 저장한다', async () => {
    const payment = PaymentModel.of({
      memberId: '1',
      seatHoldId: '9001',
      idempotencyKey: 'pay-test-key',
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-7001',
      amount: 15000,
      status: 'REFUND_REQUIRED',
      requestedAt: now,
    }).setPersistence('7001', now, now);
    const outboxEventRepository = {
      findPublishable: vi.fn(async () => [refundRequestedOutbox()]),
      save: vi.fn(async (event) => event),
    } as unknown as OutboxEventRepositoryPort;
    const paymentRepository = {
      findByIdForUpdate: vi.fn(async () => payment),
      save: vi.fn(async (currentPayment: PaymentModel) => currentPayment),
    } as unknown as PaymentRepositoryPort;
    const paymentEventLogRepository = {
      save: vi.fn(async (eventLog) => eventLog),
    } as unknown as PaymentEventLogRepositoryPort;
    const paymentGateway = {
      request: vi.fn(),
      refund: vi.fn(async () => ({ refunded: true })),
    } as unknown as PaymentGatewayPort;
    const worker = new PaymentOutboxWorker(
      outboxEventRepository,
      paymentRepository,
      paymentEventLogRepository,
      paymentGateway,
      transactionManager,
      clock,
    );

    const result = await worker.processOnce();

    expect(result).toEqual({ processed: 1, failed: 0 });
    expect(paymentGateway.refund).toHaveBeenCalledWith({
      paymentId: '7001',
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-7001',
      amount: 15000,
    });
    const savedPayments = vi.mocked(paymentRepository.save).mock.calls.map(([savedPayment]) => savedPayment);
    const savedEventLogs = vi.mocked(paymentEventLogRepository.save).mock.calls.map(([eventLog]) => eventLog);
    expect(savedPayments.some((savedPayment) => savedPayment.status === 'REFUNDED')).toBe(true);
    expect(savedEventLogs.some((eventLog) => eventLog.eventType === 'PAYMENT_REFUNDED')).toBe(true);
  });
});
