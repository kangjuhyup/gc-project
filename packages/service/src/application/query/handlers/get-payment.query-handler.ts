import { Logging } from '@kangjuhyup/rvlog';
import type { PaymentResultDto } from '@application/commands/dto';
import { assertDefined } from '@application/assertions';
import { GetPaymentQuery } from '../dto';
import type { PaymentQueryPort } from '../ports';

@Logging
export class GetPaymentQueryHandler {
  constructor(private readonly paymentQuery: PaymentQueryPort) {}

  async execute(query: GetPaymentQuery): Promise<PaymentResultDto> {
    const payment = await this.paymentQuery.findPaymentById({
      paymentId: query.paymentId,
      memberId: query.memberId,
    });
    assertDefined(payment, () => new Error('PAYMENT_NOT_FOUND'));

    return payment;
  }
}
