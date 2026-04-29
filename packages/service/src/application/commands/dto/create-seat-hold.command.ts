export class CreateSeatHoldCommand {
  private constructor(
    readonly memberId: string,
    readonly screeningId: string,
    readonly seatIds: string[],
  ) {}

  static of(params: {
    memberId: string;
    screeningId: string;
    seatIds: string[];
  }): CreateSeatHoldCommand {
    return new CreateSeatHoldCommand(params.memberId, params.screeningId, params.seatIds);
  }
}
