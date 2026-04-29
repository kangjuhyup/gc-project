export class GetHealthQuery {
  private constructor() {}

  static of(): GetHealthQuery {
    return new GetHealthQuery();
  }
}
