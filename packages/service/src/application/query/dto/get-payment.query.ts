export class GetPaymentQuery {
  private constructor(
    readonly paymentId: string,
    readonly memberId: string,
  ) {}

  static of(params: { paymentId: string; memberId: string }): GetPaymentQuery {
    return new GetPaymentQuery(params.paymentId, params.memberId);
  }
}
