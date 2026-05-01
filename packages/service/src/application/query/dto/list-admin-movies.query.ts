export class ListAdminMoviesQuery {
  private constructor(
    readonly currentPage: number,
    readonly countPerPage: number,
    readonly keyword?: string,
  ) {}

  static of(params: {
    currentPage?: number;
    countPerPage?: number;
    keyword?: string;
  }): ListAdminMoviesQuery {
    return new ListAdminMoviesQuery(
      params.currentPage ?? 1,
      params.countPerPage ?? 20,
      params.keyword,
    );
  }
}
