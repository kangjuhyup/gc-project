export class ListMyReservationsQuery {
  private constructor(
    readonly memberId: string,
    readonly limit: number,
    readonly cursor?: string,
  ) {}

  static of(params: { memberId: string; limit?: number; cursor?: string }): ListMyReservationsQuery {
    return new ListMyReservationsQuery(params.memberId, params.limit ?? 20, params.cursor);
  }
}
