import { Logging, NoLog } from '@kangjuhyup/rvlog';
import {
  OutboxEventModel,
  PaymentEventLogModel,
  PaymentEventType,
  PaymentModel,
  PaymentStatus,
} from '@domain';
import { assertDefined, assertTrue } from '@application/assertions';
import { PaymentResultDto, RequestPaymentCommand } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  OutboxEventRepositoryPort,
  PaymentEventLogRepositoryPort,
  PaymentRequestHasherPort,
  PaymentRepositoryPort,
  SeatHoldRepositoryPort,
} from '../ports';

@Logging
export class RequestPaymentCommandHandler {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly seatHoldRepository: SeatHoldRepositoryPort,
    private readonly paymentEventLogRepository: PaymentEventLogRepositoryPort,
    private readonly outboxEventRepository: OutboxEventRepositoryPort,
    private readonly paymentRequestHasher: PaymentRequestHasherPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: RequestPaymentCommand): Promise<PaymentResultDto> {
    const now = this.clock.now();
    const seatHoldIds = this.uniqueSeatHoldIds(command.seatHoldIds);
    const requestHash = this.paymentRequestHasher.hash({
      memberId: command.memberId,
      seatHoldIds,
      provider: command.provider,
      amount: command.amount,
    });
    const existingIdempotentPayment = await this.paymentRepository.findByMemberIdAndIdempotencyKey(
      command.memberId,
      command.idempotencyKey,
    );

    if (existingIdempotentPayment !== undefined) {
      existingIdempotentPayment.assertIdempotentRequestHash(requestHash);

      return this.toResult(existingIdempotentPayment);
    }

    const seatHolds = await Promise.all(seatHoldIds.map((seatHoldId) => this.seatHoldRepository.findById(seatHoldId)));
    assertTrue(seatHolds.every((seatHold) => seatHold !== undefined), () => new Error('SEAT_HOLD_NOT_FOUND'));

    const payableSeatHolds = seatHolds.filter((seatHold) => seatHold !== undefined);
    payableSeatHolds.forEach((seatHold) => seatHold.assertPayableBy(command.memberId));
    const [firstSeatHold] = payableSeatHolds;
    assertDefined(firstSeatHold, () => new Error('SEAT_HOLD_NOT_FOUND'));
    assertTrue(
      payableSeatHolds.every((seatHold) => seatHold.screeningId === firstSeatHold.screeningId),
      () => new Error('INVALID_SEAT_HOLD_REQUEST'),
    );

    const existingPayments = await this.paymentRepository.findBySeatHoldIds(seatHoldIds);
    assertTrue(
      existingPayments.every((existingPayment) => existingPayment.status === PaymentStatus.FAILED),
      () => new Error('PAYMENT_ALREADY_REQUESTED'),
    );

    const payment = await this.paymentRepository.save(
      PaymentModel.request({
        memberId: command.memberId,
        seatHoldIds,
        idempotencyKey: command.idempotencyKey,
        requestHash,
        provider: command.provider,
        amount: command.amount,
        now,
      }),
    );

    await this.paymentEventLogRepository.save(
      PaymentEventLogModel.of({
        paymentId: payment.id,
        eventType: PaymentEventType.PAYMENT_REQUESTED,
        nextStatus: payment.status,
        provider: payment.provider,
        amount: payment.amount,
        metadata: {
          seatHoldIds: payment.seatHoldIds,
          idempotencyKey: payment.idempotencyKey,
          requestHash: payment.requestHash,
        },
        occurredAt: now,
      }),
    );

    await this.outboxEventRepository.save(
      OutboxEventModel.pending({
        aggregateType: 'PAYMENT',
        aggregateId: payment.id,
        eventType: PaymentEventType.PAYMENT_REQUESTED,
        payload: {
          paymentId: payment.id,
          idempotencyKey: payment.idempotencyKey,
          requestHash: payment.requestHash,
          provider: payment.provider,
          amount: payment.amount,
        },
        occurredAt: now,
      }),
    );

    return this.toResult(payment);
  }

  @NoLog
  private toResult(payment: PaymentModel): PaymentResultDto {
    return PaymentResultDto.of({
      paymentId: payment.id,
      seatHoldId: payment.seatHoldId,
      seatHoldIds: payment.seatHoldIds,
      idempotencyKey: payment.idempotencyKey,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      reservationId: payment.reservationId,
      status: payment.status,
      amount: payment.amount,
    });
  }

  @NoLog
  private uniqueSeatHoldIds(seatHoldIds: string[]): string[] {
    const unique = [...new Set(seatHoldIds)];
    assertTrue(unique.length > 0, () => new Error('INVALID_SEAT_HOLD_REQUEST'));
    assertTrue(unique.length === seatHoldIds.length, () => new Error('INVALID_SEAT_HOLD_REQUEST'));

    return unique;
  }
}
