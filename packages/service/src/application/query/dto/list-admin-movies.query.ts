export class ListAdminMoviesQuery {
  private constructor(
    readonly limit: number,
    readonly keyword?: string,
    readonly cursor?: string,
  ) {}

  static of(params: {
    limit?: number;
    keyword?: string;
    cursor?: string;
  }): ListAdminMoviesQuery {
    return new ListAdminMoviesQuery(
      params.limit ?? 20,
      params.keyword,
      params.cursor,
    );
  }
}
