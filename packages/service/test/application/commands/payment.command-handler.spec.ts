import { describe, expect, it, vi } from 'vitest';
import {
  OutboxEventModel,
  PaymentModel,
  ReservationModel,
  SeatHoldModel,
} from '@domain';
import {
  CancelReservationCommand,
  HandlePaymentCallbackCommand,
  RefundPaymentCommand,
  RequestPaymentCommand,
} from '@application';
import {
  CancelReservationCommandHandler,
  HandlePaymentCallbackCommandHandler,
  RefundPaymentCommandHandler,
  RequestPaymentCommandHandler,
} from '@application/commands/handlers';
import type {
  ClockPort,
  OutboxEventRepositoryPort,
  PaymentCallbackVerifierPort,
  PaymentEventLogRepositoryPort,
  PaymentGatewayPort,
  PaymentRequestHasherPort,
  PaymentRepositoryPort,
  ReservationEventRepositoryPort,
  ReservationRepositoryPort,
  ReservationSeatRepositoryPort,
  SeatHoldRepositoryPort,
} from '@application/commands/ports';

const now = new Date('2026-04-29T01:00:00.000Z');
const clock: ClockPort = {
  now: vi.fn(() => now),
};
const paymentRequestHasher: PaymentRequestHasherPort = {
  hash: vi.fn((params) => JSON.stringify(params)),
};

function heldSeatHold() {
  return SeatHoldModel.of({
    screeningId: '101',
    seatId: '1001',
    memberId: '1',
    status: 'HELD',
    expiresAt: new Date('2026-04-29T01:13:00.000Z'),
  }).setPersistence('9001', now, now);
}

function pendingPayment() {
  return PaymentModel.request({
    memberId: '1',
    seatHoldId: '9001',
    idempotencyKey: 'pay-test-key',
    requestHash: paymentRequestHasher.hash({
      memberId: '1',
      seatHoldId: '9001',
      provider: 'LOCAL',
      amount: 15000,
    }),
    provider: 'LOCAL',
    amount: 15000,
    now,
  }).setPersistence('7001', now, now);
}

describe('RequestPaymentCommandHandler', () => {
  it('좌석 점유 검증 후 결제 요청, 이벤트 로그, 아웃박스 이벤트를 저장한다', async () => {
    const paymentRepository: PaymentRepositoryPort = {
      save: vi.fn(async (payment: PaymentModel) => payment.setPersistence('7001', now, now)),
      findById: vi.fn(),
      findByIdForUpdate: vi.fn(),
      findByReservationIdForUpdate: vi.fn(),
      findByMemberIdAndIdempotencyKey: vi.fn(async () => undefined),
      findBySeatHoldId: vi.fn(async () => undefined),
    };
    const seatHoldRepository = {
      findById: vi.fn(async () => heldSeatHold()),
    } as unknown as SeatHoldRepositoryPort;
    const paymentEventLogRepository = {
      save: vi.fn(async (eventLog) => eventLog),
    } as unknown as PaymentEventLogRepositoryPort;
    const outboxEventRepository = {
      save: vi.fn(async (event) => event),
    } as unknown as OutboxEventRepositoryPort;
    const handler = new RequestPaymentCommandHandler(
      paymentRepository,
      seatHoldRepository,
      paymentEventLogRepository,
      outboxEventRepository,
      paymentRequestHasher,
      clock,
    );

    const result = await handler.execute(
      RequestPaymentCommand.of({
        memberId: '1',
        seatHoldId: '9001',
        idempotencyKey: 'pay-test-key',
        provider: 'LOCAL',
        amount: 15000,
      }),
    );
    expect(result.paymentId).toBe('7001');
    expect(result.idempotencyKey).toBe('pay-test-key');
    expect(result.status).toBe('PENDING');
    const savedEventLogs = vi.mocked(paymentEventLogRepository.save).mock.calls.map(([eventLog]) => eventLog);
    const savedOutboxEvents = vi.mocked(outboxEventRepository.save).mock.calls.map(([event]) => event);
    expect(savedEventLogs.some((eventLog) => eventLog.eventType === 'PAYMENT_REQUESTED')).toBe(true);
    expect(savedOutboxEvents.some((event) => event.eventType === 'PAYMENT_REQUESTED')).toBe(true);
  });

  it('같은 멱등성 키로 동일한 결제 요청이 재전송되면 기존 결제 결과를 반환한다', async () => {
    const existingPayment = pendingPayment();
    const paymentRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIdForUpdate: vi.fn(),
      findByReservationIdForUpdate: vi.fn(),
      findByMemberIdAndIdempotencyKey: vi.fn(async () => existingPayment),
      findBySeatHoldId: vi.fn(),
    } as unknown as PaymentRepositoryPort;
    const seatHoldRepository = {
      findById: vi.fn(),
    } as unknown as SeatHoldRepositoryPort;
    const handler = new RequestPaymentCommandHandler(
      paymentRepository,
      seatHoldRepository,
      { save: vi.fn() } as unknown as PaymentEventLogRepositoryPort,
      { save: vi.fn() } as unknown as OutboxEventRepositoryPort,
      paymentRequestHasher,
      clock,
    );

    const result = await handler.execute(
      RequestPaymentCommand.of({
        memberId: '1',
        seatHoldId: '9001',
        idempotencyKey: 'pay-test-key',
        provider: 'LOCAL',
        amount: 15000,
      }),
    );

    expect(result.paymentId).toBe('7001');
    expect(paymentRepository.save).not.toHaveBeenCalled();
    expect(seatHoldRepository.findById).not.toHaveBeenCalled();
  });

  it('같은 멱등성 키로 다른 결제 요청이 들어오면 중복 결제 방지를 위해 거부한다', async () => {
    const existingPayment = pendingPayment();
    const paymentRepository = {
      save: vi.fn(),
      findByMemberIdAndIdempotencyKey: vi.fn(async () => existingPayment),
      findBySeatHoldId: vi.fn(),
    } as unknown as PaymentRepositoryPort;
    const handler = new RequestPaymentCommandHandler(
      paymentRepository,
      { findById: vi.fn() } as unknown as SeatHoldRepositoryPort,
      { save: vi.fn() } as unknown as PaymentEventLogRepositoryPort,
      { save: vi.fn() } as unknown as OutboxEventRepositoryPort,
      paymentRequestHasher,
      clock,
    );

    await expect(
      handler.execute(
        RequestPaymentCommand.of({
          memberId: '1',
          seatHoldId: '9002',
          idempotencyKey: 'pay-test-key',
          provider: 'LOCAL',
          amount: 15000,
        }),
      ),
    ).rejects.toThrow('PAYMENT_IDEMPOTENCY_KEY_CONFLICT');
  });

  it('다른 회원이 점유한 좌석으로 결제를 요청하면 거부한다', async () => {
    const paymentRepository = {
      save: vi.fn(),
      findBySeatHoldId: vi.fn(),
      findByMemberIdAndIdempotencyKey: vi.fn(async () => undefined),
    } as unknown as PaymentRepositoryPort;
    const seatHoldRepository = {
      findById: vi.fn(async () =>
        SeatHoldModel.of({
          screeningId: '101',
          seatId: '1001',
          memberId: '2',
          status: 'HELD',
          expiresAt: new Date('2026-04-29T01:13:00.000Z'),
        }).setPersistence('9001', now, now),
      ),
    } as unknown as SeatHoldRepositoryPort;
    const handler = new RequestPaymentCommandHandler(
      paymentRepository,
      seatHoldRepository,
      { save: vi.fn() } as unknown as PaymentEventLogRepositoryPort,
      { save: vi.fn() } as unknown as OutboxEventRepositoryPort,
      paymentRequestHasher,
      clock,
    );

    await expect(
      handler.execute(
        RequestPaymentCommand.of({
          memberId: '1',
          seatHoldId: '9001',
          idempotencyKey: 'pay-test-key',
          provider: 'LOCAL',
          amount: 15000,
        }),
      ),
    ).rejects.toThrow('SEAT_HOLD_FORBIDDEN');
  });
});

describe('HandlePaymentCallbackCommandHandler', () => {
  it('PG 승인 callback 후 예약 생성과 좌석 확정과 결제 승인을 저장한다', async () => {
    const paymentRepository = {
      findByIdForUpdate: vi.fn(async () => pendingPayment()),
      save: vi.fn(async (payment: PaymentModel) => payment),
    } as unknown as PaymentRepositoryPort;
    const seatHoldRepository = {
      findById: vi.fn(async () => heldSeatHold()),
      save: vi.fn(async (seatHold) => seatHold),
    } as unknown as SeatHoldRepositoryPort;
    const reservationRepository = {
      save: vi.fn(async (reservation) => reservation.setPersistence('5001', now, now)),
    } as unknown as ReservationRepositoryPort;
    const reservationSeatRepository = {
      save: vi.fn(async (reservationSeat) => reservationSeat),
    } as unknown as ReservationSeatRepositoryPort;
    const reservationEventRepository = {
      save: vi.fn(async (reservationEvent) => reservationEvent),
    } as unknown as ReservationEventRepositoryPort;
    const paymentEventLogRepository = {
      save: vi.fn(async (eventLog) => eventLog),
    } as unknown as PaymentEventLogRepositoryPort;
    const outboxEventRepository = {
      save: vi.fn(async (event) => event),
    } as unknown as OutboxEventRepositoryPort;
    const callbackVerifier: PaymentCallbackVerifierPort = {
      verify: vi.fn(() => true),
    };
    const handler = new HandlePaymentCallbackCommandHandler(
      paymentRepository,
      seatHoldRepository,
      reservationRepository,
      reservationSeatRepository,
      reservationEventRepository,
      paymentEventLogRepository,
      outboxEventRepository,
      callbackVerifier,
      clock,
    );

    const result = await handler.execute(
      HandlePaymentCallbackCommand.of({
        provider: 'LOCAL',
        providerPaymentId: 'local-payment-7001',
        paymentId: '7001',
        amount: 15000,
        approved: true,
        token: 'local-token',
      }),
    );

    expect(result.handled).toBe(true);
    expect(reservationRepository.save).toHaveBeenCalled();
    expect(reservationSeatRepository.save).toHaveBeenCalled();
    const savedSeatHolds = vi.mocked(seatHoldRepository.save).mock.calls.map(([seatHold]) => seatHold);
    const savedPayments = vi.mocked(paymentRepository.save).mock.calls.map(([payment]) => payment);
    const savedOutboxEvents = vi.mocked(outboxEventRepository.save).mock.calls.map(([event]) => event);
    expect(savedSeatHolds.some((seatHold) => seatHold.status === 'CONFIRMED')).toBe(true);
    expect(savedPayments.some((payment) => payment.status === 'APPROVED')).toBe(true);
    expect(savedOutboxEvents.some((event) => event.eventType === 'RESERVATION_CONFIRMED')).toBe(true);
  });

  it('PG 승인 후 예약 후처리에 실패하면 환불 요청 아웃박스를 저장한다', async () => {
    const paymentRepository = {
      findByIdForUpdate: vi.fn(async () => pendingPayment()),
      save: vi.fn(async (payment: PaymentModel) => payment),
    } as unknown as PaymentRepositoryPort;
    const outboxEventRepository = {
      save: vi.fn(async (event: OutboxEventModel) => event),
    } as unknown as OutboxEventRepositoryPort;
    const handler = new HandlePaymentCallbackCommandHandler(
      paymentRepository,
      { findById: vi.fn(async () => heldSeatHold()) } as unknown as SeatHoldRepositoryPort,
      { save: vi.fn(async () => { throw new Error('reservation failed'); }) } as unknown as ReservationRepositoryPort,
      { save: vi.fn() } as unknown as ReservationSeatRepositoryPort,
      { save: vi.fn() } as unknown as ReservationEventRepositoryPort,
      { save: vi.fn(async (eventLog) => eventLog) } as unknown as PaymentEventLogRepositoryPort,
      outboxEventRepository,
      { verify: vi.fn(() => true) },
      clock,
    );

    await handler.execute(
      HandlePaymentCallbackCommand.of({
        provider: 'LOCAL',
        providerPaymentId: 'local-payment-7001',
        paymentId: '7001',
        amount: 15000,
        approved: true,
        token: 'local-token',
      }),
    );

    const savedPayments = vi.mocked(paymentRepository.save).mock.calls.map(([payment]) => payment);
    const savedOutboxEvents = vi.mocked(outboxEventRepository.save).mock.calls.map(([event]) => event);
    expect(savedPayments.some((payment) => payment.status === 'REFUND_REQUIRED')).toBe(true);
    expect(savedOutboxEvents.some((event) => event.eventType === 'PAYMENT_REFUND_REQUESTED')).toBe(true);
  });
});

describe('RefundPaymentCommandHandler', () => {
  it('환불 요청이 성공하면 결제를 REFUNDED 상태로 저장한다', async () => {
    const payment = PaymentModel.of({
      memberId: '1',
      seatHoldId: '9001',
      idempotencyKey: 'pay-test-key',
      requestHash: paymentRequestHasher.hash({
        memberId: '1',
        seatHoldId: '9001',
        provider: 'LOCAL',
        amount: 15000,
      }),
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-7001',
      amount: 15000,
      status: 'REFUND_REQUIRED',
      requestedAt: now,
    }).setPersistence('7001', now, now);
    const paymentRepository = {
      findByIdForUpdate: vi.fn(async () => payment),
      save: vi.fn(async (currentPayment: PaymentModel) => currentPayment),
    } as unknown as PaymentRepositoryPort;
    const paymentGateway: PaymentGatewayPort = {
      request: vi.fn(),
      refund: vi.fn(async () => ({ refunded: true })),
    };
    const handler = new RefundPaymentCommandHandler(
      paymentRepository,
      { save: vi.fn(async (eventLog) => eventLog) } as unknown as PaymentEventLogRepositoryPort,
      paymentGateway,
      clock,
    );

    const result = await handler.execute(RefundPaymentCommand.of({ paymentId: '7001' }));

    expect(paymentGateway.refund).toHaveBeenCalledWith({
      paymentId: '7001',
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-7001',
      amount: 15000,
    });
    expect(result.status).toBe('REFUNDED');
  });
});

describe('CancelReservationCommandHandler', () => {
  function confirmedReservation() {
    return ReservationModel.of({
      reservationNumber: 'R20260429001',
      memberId: '1',
      screeningId: '101',
      status: 'CONFIRMED',
      totalPrice: 15000,
    }).setPersistence('5001', now, now);
  }

  function approvedPayment() {
    return PaymentModel.of({
      memberId: '1',
      seatHoldId: '9001',
      idempotencyKey: 'pay-cancel-key',
      requestHash: paymentRequestHasher.hash({
        memberId: '1',
        seatHoldId: '9001',
        provider: 'LOCAL',
        amount: 15000,
      }),
      reservationId: '5001',
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-7001',
      amount: 15000,
      status: 'APPROVED',
      requestedAt: now,
      approvedAt: now,
    }).setPersistence('7001', now, now);
  }

  it('내가 결제 완료한 예매를 취소하면 예매 취소와 환불 요청 이벤트를 저장한다', async () => {
    const reservationRepository = {
      findByIdForUpdate: vi.fn(async () => confirmedReservation()),
      save: vi.fn(async (reservation: ReservationModel) => reservation),
    } as unknown as ReservationRepositoryPort;
    const paymentRepository = {
      findByReservationIdForUpdate: vi.fn(async () => approvedPayment()),
      save: vi.fn(async (payment: PaymentModel) => payment),
    } as unknown as PaymentRepositoryPort;
    const reservationEventRepository = {
      save: vi.fn(async (event) => event),
    } as unknown as ReservationEventRepositoryPort;
    const paymentEventLogRepository = {
      save: vi.fn(async (eventLog) => eventLog),
    } as unknown as PaymentEventLogRepositoryPort;
    const outboxEventRepository = {
      save: vi.fn(async (event) => event),
    } as unknown as OutboxEventRepositoryPort;
    const handler = new CancelReservationCommandHandler(
      reservationRepository,
      paymentRepository,
      reservationEventRepository,
      paymentEventLogRepository,
      outboxEventRepository,
      clock,
    );

    const result = await handler.execute(
      CancelReservationCommand.of({
        memberId: '1',
        reservationId: '5001',
        reason: 'user request',
      }),
    );

    expect(result.reservationStatus).toBe('CANCELED');
    expect(result.paymentStatus).toBe('REFUND_REQUIRED');
    const savedReservations = vi.mocked(reservationRepository.save).mock.calls.map(([reservation]) => reservation);
    const savedPayments = vi.mocked(paymentRepository.save).mock.calls.map(([payment]) => payment);
    const savedOutboxEvents = vi.mocked(outboxEventRepository.save).mock.calls.map(([event]) => event);
    expect(savedReservations.some((reservation) => reservation.status === 'CANCELED')).toBe(true);
    expect(savedPayments.some((payment) => payment.status === 'REFUND_REQUIRED')).toBe(true);
    expect(savedOutboxEvents.some((event) => event.eventType === 'PAYMENT_REFUND_REQUESTED')).toBe(true);
  });

  it('다른 회원의 예매 취소 요청은 거부한다', async () => {
    const handler = new CancelReservationCommandHandler(
      {
        findByIdForUpdate: vi.fn(async () => confirmedReservation()),
        save: vi.fn(),
      } as unknown as ReservationRepositoryPort,
      { findByReservationIdForUpdate: vi.fn() } as unknown as PaymentRepositoryPort,
      { save: vi.fn() } as unknown as ReservationEventRepositoryPort,
      { save: vi.fn() } as unknown as PaymentEventLogRepositoryPort,
      { save: vi.fn() } as unknown as OutboxEventRepositoryPort,
      clock,
    );

    await expect(
      handler.execute(
        CancelReservationCommand.of({
          memberId: '2',
          reservationId: '5001',
          reason: 'user request',
        }),
      ),
    ).rejects.toThrow('RESERVATION_FORBIDDEN');
  });
});
