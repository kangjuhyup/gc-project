export class ListMoviesQuery {
  private constructor(
    readonly limit: number,
    readonly keyword?: string,
    readonly cursor?: string,
  ) {}

  static of(params: {
    limit?: number;
    keyword?: string;
    cursor?: string;
  }): ListMoviesQuery {
    return new ListMoviesQuery(
      params.limit ?? 20,
      params.keyword,
      params.cursor,
    );
  }
}
