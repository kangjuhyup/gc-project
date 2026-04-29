import type { PaymentResultDto } from '@application/commands/dto';

export const PAYMENT_QUERY = Symbol('PAYMENT_QUERY');

export interface PaymentQueryPort {
  findPaymentById(paymentId: string): Promise<PaymentResultDto | undefined>;
}
