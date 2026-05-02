import { MaskLog } from '@kangjuhyup/rvlog';

export class SearchAddressesQuery {
  @MaskLog({ type: 'full' })
  readonly keyword: string;

  readonly currentPage: number;

  readonly countPerPage: number;

  private constructor(params: { keyword: string; currentPage: number; countPerPage: number }) {
    this.keyword = params.keyword;
    this.currentPage = params.currentPage;
    this.countPerPage = params.countPerPage;
  }

  static of(params: {
    keyword: string;
    currentPage?: number;
    countPerPage?: number;
  }): SearchAddressesQuery {
    return new SearchAddressesQuery({
      keyword: params.keyword,
      currentPage: params.currentPage ?? 1,
      countPerPage: params.countPerPage ?? 10,
    });
  }
}
