import { Logging } from '@kangjuhyup/rvlog';
import { PaymentEventLogModel, PaymentEventType } from '@domain';
import { assertDefined } from '@application/assertions';
import { PaymentRefundResultDto, RefundPaymentCommand } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  PaymentEventLogRepositoryPort,
  PaymentGatewayPort,
  PaymentRepositoryPort,
} from '../ports';

@Logging
export class RefundPaymentCommandHandler {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly paymentEventLogRepository: PaymentEventLogRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: RefundPaymentCommand): Promise<PaymentRefundResultDto> {
    const now = this.clock.now();
    const payment = await this.paymentRepository.findByIdForUpdate(command.paymentId);
    assertDefined(payment, () => new Error('PAYMENT_NOT_FOUND'));

    const providerPaymentId = payment.requireProviderPaymentId();

    const refunding = payment.startRefund({ now });
    await this.paymentRepository.save(refunding);

    const refundResult = await this.paymentGateway.refund({
      paymentId: refunding.id,
      provider: refunding.provider,
      providerPaymentId,
      amount: refunding.amount,
    });
    const resultPayment = refundResult.refunded
      ? refunding.completeRefund({ now: this.clock.now() })
      : refunding.failRefund({
          reason: refundResult.reason ?? 'PAYMENT_REFUND_FAILED',
          now: this.clock.now(),
        });

    await this.paymentRepository.save(resultPayment);
    await this.paymentEventLogRepository.save(
      PaymentEventLogModel.of({
        paymentId: resultPayment.id,
        eventType: refundResult.refunded
          ? PaymentEventType.PAYMENT_REFUNDED
          : PaymentEventType.PAYMENT_REFUND_FAILED,
        previousStatus: refunding.status,
        nextStatus: resultPayment.status,
        provider: resultPayment.provider,
        providerPaymentId: resultPayment.providerPaymentId,
        amount: resultPayment.amount,
        reason: resultPayment.failureReason,
        occurredAt: this.clock.now(),
      }),
    );

    return PaymentRefundResultDto.of({
      paymentId: resultPayment.id,
      status: resultPayment.status,
    });
  }
}
