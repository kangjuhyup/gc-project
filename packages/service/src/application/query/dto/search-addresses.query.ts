export class SearchAddressesQuery {
  private constructor(
    readonly keyword: string,
    readonly currentPage: number,
    readonly countPerPage: number,
  ) {}

  static of(params: {
    keyword: string;
    currentPage?: number;
    countPerPage?: number;
  }): SearchAddressesQuery {
    return new SearchAddressesQuery(
      params.keyword,
      params.currentPage ?? 1,
      params.countPerPage ?? 10,
    );
  }
}
