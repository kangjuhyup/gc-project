import type { PaymentProviderType } from '@domain';

export class RequestPaymentCommand {
  private constructor(
    readonly memberId: string,
    readonly seatHoldId: string,
    readonly provider: PaymentProviderType,
    readonly amount: number,
  ) {}

  static of(params: {
    memberId: string;
    seatHoldId: string;
    provider: PaymentProviderType;
    amount: number;
  }): RequestPaymentCommand {
    return new RequestPaymentCommand(params.memberId, params.seatHoldId, params.provider, params.amount);
  }
}
