export class RefundPaymentCommand {
  private constructor(readonly paymentId: string) {}

  static of(params: { paymentId: string }): RefundPaymentCommand {
    return new RefundPaymentCommand(params.paymentId);
  }
}
