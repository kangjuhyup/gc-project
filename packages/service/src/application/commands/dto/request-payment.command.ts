import type { PaymentProviderType } from '@domain';

export class RequestPaymentCommand {
  private constructor(
    readonly memberId: string,
    readonly seatHoldId: string,
    readonly idempotencyKey: string,
    readonly provider: PaymentProviderType,
    readonly amount: number,
  ) {}

  static of(params: {
    memberId: string;
    seatHoldId: string;
    idempotencyKey: string;
    provider: PaymentProviderType;
    amount: number;
  }): RequestPaymentCommand {
    return new RequestPaymentCommand(
      params.memberId,
      params.seatHoldId,
      params.idempotencyKey,
      params.provider,
      params.amount,
    );
  }
}
