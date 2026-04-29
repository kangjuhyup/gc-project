export class ListScreeningSeatsQuery {
  private constructor(readonly screeningId: string) {}

  static of(params: { screeningId: string }): ListScreeningSeatsQuery {
    return new ListScreeningSeatsQuery(params.screeningId);
  }
}
