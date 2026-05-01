import { Logging } from '@kangjuhyup/rvlog';
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
    const requestHash = this.paymentRequestHasher.hash({
      memberId: command.memberId,
      seatHoldId: command.seatHoldId,
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

    const seatHold = await this.seatHoldRepository.findById(command.seatHoldId);
    assertDefined(seatHold, () => new Error('SEAT_HOLD_NOT_FOUND'));
    seatHold.assertPayableBy(command.memberId);

    const existingPayment = await this.paymentRepository.findBySeatHoldId(command.seatHoldId);
    assertTrue(
      existingPayment === undefined || existingPayment.status === PaymentStatus.FAILED,
      () => new Error('PAYMENT_ALREADY_REQUESTED'),
    );

    const payment = await this.paymentRepository.save(
      PaymentModel.request({
        memberId: command.memberId,
        seatHoldId: command.seatHoldId,
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
          seatHoldId: payment.seatHoldId,
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

  private toResult(payment: PaymentModel): PaymentResultDto {
    return PaymentResultDto.of({
      paymentId: payment.id,
      seatHoldId: payment.seatHoldId,
      idempotencyKey: payment.idempotencyKey,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      reservationId: payment.reservationId,
      status: payment.status,
      amount: payment.amount,
    });
  }
}
