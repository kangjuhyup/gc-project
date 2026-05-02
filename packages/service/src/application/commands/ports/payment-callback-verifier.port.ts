import type { PaymentProviderType } from '@domain';

export const PAYMENT_CALLBACK_VERIFIER = Symbol('PAYMENT_CALLBACK_VERIFIER');

export interface PaymentCallbackVerifierPort {
  verify(params: { provider: PaymentProviderType; token?: string }): Promise<boolean> | boolean;
}
