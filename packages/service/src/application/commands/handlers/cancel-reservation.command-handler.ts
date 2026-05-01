import { Logging } from '@kangjuhyup/rvlog';
import {
  OutboxEventModel,
  PaymentEventLogModel,
  PaymentEventType,
  ReservationEventModel,
  ReservationEventType,
} from '@domain';
import { assertDefined } from '@application/assertions';
import { CancelReservationCommand, ReservationCanceledDto } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  OutboxEventRepositoryPort,
  PaymentEventLogRepositoryPort,
  PaymentRepositoryPort,
  ReservationEventRepositoryPort,
  ReservationRepositoryPort,
} from '../ports';

@Logging
export class CancelReservationCommandHandler {
  constructor(
    private readonly reservationRepository: ReservationRepositoryPort,
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly reservationEventRepository: ReservationEventRepositoryPort,
    private readonly paymentEventLogRepository: PaymentEventLogRepositoryPort,
    private readonly outboxEventRepository: OutboxEventRepositoryPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: CancelReservationCommand): Promise<ReservationCanceledDto> {
    const now = this.clock.now();
    const reservation = await this.reservationRepository.findByIdForUpdate(command.reservationId);
    assertDefined(reservation, () => new Error('RESERVATION_NOT_FOUND'));
    reservation.assertOwnedBy(command.memberId);

    const payment = await this.paymentRepository.findByReservationIdForUpdate(reservation.id);
    assertDefined(payment, () => new Error('PAYMENT_NOT_FOUND'));

    payment.assertOwnedBy(command.memberId, 'RESERVATION_FORBIDDEN');
    payment.requireProviderPaymentId();

    const reason = command.reason ?? 'RESERVATION_CANCELED';
    const canceledReservation = reservation.cancel({ reason, now });
    const refundRequiredPayment = payment.requestCancelRefund({ reason, now });

    await this.reservationRepository.save(canceledReservation);
    await this.paymentRepository.save(refundRequiredPayment);
    await this.reservationEventRepository.save(
      ReservationEventModel.of({
        reservationId: canceledReservation.id,
        eventType: ReservationEventType.CANCELED,
        description: reason,
      }),
    );
    await this.paymentEventLogRepository.save(
      PaymentEventLogModel.of({
        paymentId: refundRequiredPayment.id,
        eventType: PaymentEventType.PAYMENT_REFUND_REQUESTED,
        previousStatus: payment.status,
        nextStatus: refundRequiredPayment.status,
        provider: refundRequiredPayment.provider,
        providerPaymentId: refundRequiredPayment.providerPaymentId,
        amount: refundRequiredPayment.amount,
        reason,
        metadata: { reservationId: canceledReservation.id },
        occurredAt: now,
      }),
    );
    await this.outboxEventRepository.save(
      OutboxEventModel.pending({
        aggregateType: 'PAYMENT',
        aggregateId: refundRequiredPayment.id,
        eventType: PaymentEventType.PAYMENT_REFUND_REQUESTED,
        payload: { paymentId: refundRequiredPayment.id, reservationId: canceledReservation.id },
        occurredAt: now,
      }),
    );

    return ReservationCanceledDto.of({
      reservationId: canceledReservation.id,
      paymentId: refundRequiredPayment.id,
      reservationStatus: canceledReservation.status,
      paymentStatus: refundRequiredPayment.status,
      reason,
    });
  }
}
