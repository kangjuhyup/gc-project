export class CheckUserIdAvailabilityQuery {
  private constructor(readonly userId: string) {}

  static of(params: { userId: string }): CheckUserIdAvailabilityQuery {
    return new CheckUserIdAvailabilityQuery(params.userId);
  }
}
