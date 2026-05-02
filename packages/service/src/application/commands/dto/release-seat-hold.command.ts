export class ReleaseSeatHoldCommand {
  private constructor(
    readonly holdId: string,
    readonly memberId: string,
  ) {}

  static of(params: { holdId: string; memberId: string }): ReleaseSeatHoldCommand {
    return new ReleaseSeatHoldCommand(params.holdId, params.memberId);
  }
}
