import { Logging } from '@kangjuhyup/rvlog';
import {
  OutboxEventModel,
  PaymentEventLogModel,
  PaymentEventType,
  PaymentModel,
  PaymentStatus,
  ReservationEventModel,
  ReservationModel,
  ReservationSeatModel,
} from '@domain';
import { HandlePaymentCallbackCommand, PaymentCallbackResultDto } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  OutboxEventRepositoryPort,
  PaymentCallbackVerifierPort,
  PaymentEventLogRepositoryPort,
  PaymentRepositoryPort,
  ReservationEventRepositoryPort,
  ReservationRepositoryPort,
  ReservationSeatRepositoryPort,
  SeatHoldRepositoryPort,
} from '../ports';

@Logging
export class HandlePaymentCallbackCommandHandler {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly seatHoldRepository: SeatHoldRepositoryPort,
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly reservationSeatRepository: ReservationSeatRepositoryPort,
    private readonly reservationEventRepository: ReservationEventRepositoryPort,
    private readonly paymentEventLogRepository: PaymentEventLogRepositoryPort,
    private readonly outboxEventRepository: OutboxEventRepositoryPort,
    private readonly paymentCallbackVerifier: PaymentCallbackVerifierPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: HandlePaymentCallbackCommand): Promise<PaymentCallbackResultDto> {
    const verified = await this.paymentCallbackVerifier.verify({
      provider: command.provider,
      token: command.token,
    });

    if (!verified) {
      throw new Error('PAYMENT_CALLBACK_INVALID');
    }

    const now = this.clock.now();
    const payment = await this.paymentRepository.findByIdForUpdate(command.paymentId);

    if (payment === undefined) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status === PaymentStatus.APPROVED || payment.status === PaymentStatus.FAILED) {
      return PaymentCallbackResultDto.of({ paymentId: payment.id, handled: true });
    }

    if (payment.provider !== command.provider) {
      throw new Error('PAYMENT_PROVIDER_MISMATCH');
    }

    if (!command.approved) {
      const failed = payment.fail({
        providerPaymentId: command.providerPaymentId,
        reason: command.failureReason,
        now,
      });
      await this.paymentRepository.save(failed);
      await this.paymentEventLogRepository.save(
        PaymentEventLogModel.of({
          paymentId: failed.id,
          eventType: PaymentEventType.PAYMENT_FAILED,
          previousStatus: payment.status,
          nextStatus: failed.status,
          provider: failed.provider,
          providerPaymentId: failed.providerPaymentId,
          amount: failed.amount,
          reason: failed.failureReason,
          occurredAt: now,
        }),
      );
      return PaymentCallbackResultDto.of({ paymentId: failed.id, handled: true });
    }

    const approving = payment.markApproving({
      providerPaymentId: command.providerPaymentId,
      amount: command.amount,
      now,
    });
    await this.paymentRepository.save(approving);
    await this.paymentEventLogRepository.save(
      PaymentEventLogModel.of({
        paymentId: approving.id,
        eventType: PaymentEventType.PAYMENT_CALLBACK_APPROVED,
        previousStatus: payment.status,
        nextStatus: approving.status,
        provider: approving.provider,
        providerPaymentId: approving.providerPaymentId,
        amount: approving.amount,
        occurredAt: now,
      }),
    );

    try {
      await this.confirmReservation(approving, now);
    } catch (error) {
      const refundRequired = approving.requireRefund({
        reason: error instanceof Error ? error.message : 'PAYMENT_POST_PROCESSING_FAILED',
        now,
      });
      await this.paymentRepository.save(refundRequired);
      await this.paymentEventLogRepository.save(
        PaymentEventLogModel.of({
          paymentId: refundRequired.id,
          eventType: PaymentEventType.PAYMENT_POST_PROCESSING_FAILED,
          previousStatus: approving.status,
          nextStatus: refundRequired.status,
          provider: refundRequired.provider,
          providerPaymentId: refundRequired.providerPaymentId,
          amount: refundRequired.amount,
          reason: refundRequired.failureReason,
          occurredAt: now,
        }),
      );
      await this.outboxEventRepository.save(
        OutboxEventModel.pending({
          aggregateType: 'PAYMENT',
          aggregateId: refundRequired.id,
          eventType: PaymentEventType.PAYMENT_REFUND_REQUESTED,
          payload: { paymentId: refundRequired.id },
          occurredAt: now,
        }),
      );
    }

    return PaymentCallbackResultDto.of({ paymentId: payment.id, handled: true });
  }

  private async confirmReservation(payment: PaymentModel, now: Date): Promise<void> {
    const seatHold = await this.seatHoldRepository.findById(payment.seatHoldId);

    if (seatHold === undefined) {
      throw new Error('SEAT_HOLD_NOT_FOUND');
    }

    const reservation = await this.reservationRepository.save(
      ReservationModel.of({
        reservationNumber: this.reservationNumber(payment.id),
        memberId: payment.memberId,
        screeningId: seatHold.screeningId,
        status: 'CONFIRMED',
        totalPrice: payment.amount,
      }),
    );
    await this.reservationSeatRepository.save(
      ReservationSeatModel.of({
        reservationId: reservation.id,
        screeningId: seatHold.screeningId,
        seatId: seatHold.seatId,
      }),
    );
    await this.seatHoldRepository.save(seatHold.confirm({ reservationId: reservation.id, now }));
    await this.reservationEventRepository.save(
      ReservationEventModel.of({
        reservationId: reservation.id,
        eventType: 'CONFIRMED',
        description: `payment:${payment.id}`,
      }),
    );
    const approved = payment.approve({ reservationId: reservation.id, now });
    await this.paymentRepository.save(approved);
    await this.paymentEventLogRepository.save(
      PaymentEventLogModel.of({
        paymentId: approved.id,
        eventType: PaymentEventType.PAYMENT_APPROVED,
        previousStatus: payment.status,
        nextStatus: approved.status,
        provider: approved.provider,
        providerPaymentId: approved.providerPaymentId,
        amount: approved.amount,
        metadata: { reservationId: reservation.id },
        occurredAt: now,
      }),
    );
    await this.outboxEventRepository.save(
      OutboxEventModel.pending({
        aggregateType: 'RESERVATION',
        aggregateId: reservation.id,
        eventType: 'RESERVATION_CONFIRMED',
        payload: {
          paymentId: approved.id,
          reservationId: reservation.id,
        },
        occurredAt: now,
      }),
    );
  }

  private reservationNumber(paymentId: string): string {
    return `R${paymentId.padStart(19, '0')}`.slice(0, 20);
  }
}
