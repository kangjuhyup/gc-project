export class GetMyReservationQuery {
  private constructor(
    readonly memberId: string,
    readonly reservationId: string,
  ) {}

  static of(params: { memberId: string; reservationId: string }): GetMyReservationQuery {
    return new GetMyReservationQuery(params.memberId, params.reservationId);
  }
}
