import { Logging } from '@kangjuhyup/rvlog';
import {
  OutboxEventModel,
  PaymentEventLogModel,
  PaymentEventType,
  PaymentModel,
  PaymentStatus,
  SeatHoldStatus,
} from '@domain';
import { PaymentResultDto, RequestPaymentCommand } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  OutboxEventRepositoryPort,
  PaymentEventLogRepositoryPort,
  PaymentRepositoryPort,
  SeatHoldRepositoryPort,
  TransactionManagerPort,
} from '../ports';

@Logging
export class RequestPaymentCommandHandler {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly seatHoldRepository: SeatHoldRepositoryPort,
    private readonly paymentEventLogRepository: PaymentEventLogRepositoryPort,
    private readonly outboxEventRepository: OutboxEventRepositoryPort,
    readonly transactionManager: TransactionManagerPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: RequestPaymentCommand): Promise<PaymentResultDto> {
    const now = this.clock.now();
    const seatHold = await this.seatHoldRepository.findById(command.seatHoldId);

    if (seatHold === undefined) {
      throw new Error('SEAT_HOLD_NOT_FOUND');
    }

    if (seatHold.memberId !== command.memberId) {
      throw new Error('SEAT_HOLD_FORBIDDEN');
    }

    if (seatHold.status !== SeatHoldStatus.HELD || seatHold.reservationId !== undefined) {
      throw new Error('SEAT_HOLD_PAYMENT_COMPLETED');
    }

    const existingPayment = await this.paymentRepository.findBySeatHoldId(command.seatHoldId);

    if (existingPayment !== undefined && existingPayment.status !== PaymentStatus.FAILED) {
      throw new Error('PAYMENT_ALREADY_REQUESTED');
    }

    const payment = await this.paymentRepository.save(
      PaymentModel.request({
        memberId: command.memberId,
        seatHoldId: command.seatHoldId,
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
        metadata: { seatHoldId: payment.seatHoldId },
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
          provider: payment.provider,
          amount: payment.amount,
        },
        occurredAt: now,
      }),
    );

    return PaymentResultDto.of({
      paymentId: payment.id,
      seatHoldId: payment.seatHoldId,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
    });
  }
}
