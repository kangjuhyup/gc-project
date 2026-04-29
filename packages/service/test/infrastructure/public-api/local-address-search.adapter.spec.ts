import { describe, expect, it } from 'vitest';
import { SearchAddressesQuery } from '@application/query/dto';
import { LocalAddressSearchAdapter } from '@infrastructure/public-api';

describe('LocalAddressSearchAdapter', () => {
  it('하드코딩된 로컬 JSON 주소에서 키워드가 포함된 주소를 검색한다', async () => {
    const adapter = new LocalAddressSearchAdapter();

    const result = await adapter.search(
      SearchAddressesQuery.of({ keyword: '테헤란로', currentPage: 1, countPerPage: 10 }),
    );

    expect(result.totalCount).toBe(2);
    expect(result.currentPage).toBe(1);
    expect(result.countPerPage).toBe(10);
    expect(result.items.map((item) => item.roadAddress)).toEqual([
      '서울특별시 강남구 테헤란로 427',
      '서울특별시 강남구 테헤란로 123',
    ]);
  });

  it('로컬 JSON 주소 검색 결과를 페이지 단위로 반환한다', async () => {
    const adapter = new LocalAddressSearchAdapter();

    const result = await adapter.search(
      SearchAddressesQuery.of({ keyword: '서울특별시', currentPage: 2, countPerPage: 2 }),
    );

    expect(result.totalCount).toBe(3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.roadAddress).toBe('서울특별시 서초구 강남대로 465');
  });

  it('검색어가 없으면 빈 목록을 반환한다', async () => {
    const adapter = new LocalAddressSearchAdapter();

    const result = await adapter.search(
      SearchAddressesQuery.of({ keyword: '존재하지않는주소' }),
    );

    expect(result.totalCount).toBe(0);
    expect(result.items).toEqual([]);
  });
});
