import { describe, expect, it, vi } from 'vitest';
import { SearchAddressesQuery } from '@application/query/dto';
import { AddressController } from '@presentation/http';

describe('AddressController', () => {
  it('주소 검색 요청을 query handler에 위임하고 SignupPage 스펙 응답을 반환한다', async () => {
    const expected = {
      totalCount: 1,
      currentPage: 1,
      countPerPage: 10,
      items: [
        {
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
        },
      ],
    };
    const queryHandler = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new AddressController(queryHandler as never);

    const result = await controller.search({
      keyword: '테헤란로',
      currentPage: 2,
      countPerPage: 20,
    } as never);

    expect(queryHandler.execute).toHaveBeenCalledWith(
      SearchAddressesQuery.of({ keyword: '테헤란로', currentPage: 2, countPerPage: 20 }),
    );
    expect(result).toBe(expected);
  });
});
