export class CancelReservationCommand {
  private constructor(
    readonly memberId: string,
    readonly reservationId: string,
    readonly reason?: string,
  ) {}

  static of(params: {
    memberId: string;
    reservationId: string;
    reason?: string;
  }): CancelReservationCommand {
    return new CancelReservationCommand(params.memberId, params.reservationId, params.reason);
  }
}
