import { MaskLog } from '@kangjuhyup/rvlog';
import type { PaymentProviderType } from '@domain';

export class HandlePaymentCallbackCommand {
  @MaskLog({ type: 'full' })
  readonly token?: string;

  @MaskLog({ type: 'full' })
  readonly providerPaymentId: string;

  private constructor(
    readonly provider: PaymentProviderType,
    providerPaymentId: string,
    readonly paymentId: string,
    readonly amount: number,
    readonly approved: boolean,
    readonly failureReason?: string,
    token?: string,
  ) {
    this.providerPaymentId = providerPaymentId;
    this.token = token;
  }

  static of(params: {
    provider: PaymentProviderType;
    providerPaymentId: string;
    paymentId: string;
    amount: number;
    approved: boolean;
    failureReason?: string;
    token?: string;
  }): HandlePaymentCallbackCommand {
    return new HandlePaymentCallbackCommand(
      params.provider,
      params.providerPaymentId,
      params.paymentId,
      params.amount,
      params.approved,
      params.failureReason,
      params.token,
    );
  }
}
