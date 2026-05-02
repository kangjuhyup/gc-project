import type { PaymentResultDto } from '@application/commands/dto';

export const PAYMENT_QUERY = Symbol('PAYMENT_QUERY');

export interface PaymentQueryPort {
  findPaymentById(params: {
    paymentId: string;
    memberId: string;
  }): Promise<PaymentResultDto | undefined>;
}
