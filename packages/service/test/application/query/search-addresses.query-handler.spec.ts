import { describe, expect, it, vi } from 'vitest';
import {
  AddressSearchItemDto,
  AddressSearchResultDto,
  SearchAddressesQuery,
} from '@application/query/dto';
import { SearchAddressesQueryHandler } from '@application/query/handlers';
import type { AddressSearchPort } from '@application/query/ports';

describe('SearchAddressesQueryHandler', () => {
  it('주소 검색 요청을 공공 API 검색 port에 위임하고 결과를 반환한다', async () => {
    const expected = AddressSearchResultDto.of({
      totalCount: 1,
      currentPage: 1,
      countPerPage: 10,
      items: [
        AddressSearchItemDto.of({
          roadAddress: '서울특별시 강남구 테헤란로 123',
          roadAddressPart1: '서울특별시 강남구 테헤란로 123',
          roadAddressPart2: '',
          jibunAddress: '서울특별시 강남구 역삼동 123',
          englishAddress: '123, Teheran-ro, Gangnam-gu, Seoul',
          zipCode: '06234',
          administrativeCode: '1168010100',
          roadNameCode: '116803122001',
          buildingManagementNumber: '1168010100101230000000001',
          buildingName: '테스트빌딩',
          city: '서울특별시',
          district: '강남구',
          town: '역삼동',
        }),
      ],
    });
    const addressSearch = {
      search: vi.fn().mockResolvedValue(expected),
    } satisfies AddressSearchPort;
    const handler = new SearchAddressesQueryHandler(addressSearch);
    const query = SearchAddressesQuery.of({
      keyword: '테헤란로',
      currentPage: 2,
      countPerPage: 20,
    });

    const result = await handler.execute(query);

    expect(addressSearch.search).toHaveBeenCalledWith(query);
    expect(result).toBe(expected);
  });
});
