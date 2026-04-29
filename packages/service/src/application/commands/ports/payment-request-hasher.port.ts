import type { PaymentProviderType } from '@domain';

export const PAYMENT_REQUEST_HASHER = Symbol('PAYMENT_REQUEST_HASHER');

export interface PaymentRequestHashParams {
  readonly memberId: string;
  readonly seatHoldId: string;
  readonly provider: PaymentProviderType;
  readonly amount: number;
}

export interface PaymentRequestHasherPort {
  hash(params: PaymentRequestHashParams): string;
}
