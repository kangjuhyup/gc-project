import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SearchAddressesQuery } from '@application/query/dto';
import { JusoAddressSearchAdapter } from '@infrastructure/public-api';

describe('JusoAddressSearchAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('공공 주소 API 요청 파라미터를 구성하고 SignupPage 스펙으로 매핑한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: {
          common: {
            totalCount: '1',
            currentPage: '2',
            countPerPage: '20',
            errorCode: '0',
            errorMessage: '정상',
          },
          juso: [
            {
              roadAddr: '서울특별시 강남구 테헤란로 123',
              roadAddrPart1: '서울특별시 강남구 테헤란로 123',
              roadAddrPart2: '',
              jibunAddr: '서울특별시 강남구 역삼동 123',
              engAddr: '123, Teheran-ro, Gangnam-gu, Seoul',
              zipNo: '06234',
              admCd: '1168010100',
              rnMgtSn: '116803122001',
              bdMgtSn: '1168010100101230000000001',
              bdNm: '테스트빌딩',
              siNm: '서울특별시',
              sggNm: '강남구',
              emdNm: '역삼동',
            },
          ],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new JusoAddressSearchAdapter({
      getOrThrow: vi.fn().mockReturnValue('juso-test-key'),
    } as unknown as ConfigService);

    const result = await adapter.search(
      SearchAddressesQuery.of({ keyword: '테헤란로', currentPage: 2, countPerPage: 20 }),
    );

    const requestedUrl = fetchMock.mock.calls[0]?.[0] as URL;
    expect(requestedUrl.searchParams.get('confmKey')).toBe('juso-test-key');
    expect(requestedUrl.searchParams.get('keyword')).toBe('테헤란로');
    expect(requestedUrl.searchParams.get('currentPage')).toBe('2');
    expect(requestedUrl.searchParams.get('countPerPage')).toBe('20');
    expect(requestedUrl.searchParams.get('resultType')).toBe('json');
    expect(result.totalCount).toBe(1);
    expect(result.currentPage).toBe(2);
    expect(result.countPerPage).toBe(20);
    expect(result.items[0]?.roadAddress).toBe('서울특별시 강남구 테헤란로 123');
    expect(result.items[0]?.zipCode).toBe('06234');
    expect(result.items[0]?.buildingManagementNumber).toBe('1168010100101230000000001');
  });

  it('공공 주소 API 오류 응답은 실패로 처리한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: {
            common: {
              errorCode: 'E0001',
              errorMessage: '인증키 오류',
            },
          },
        }),
      }),
    );
    const adapter = new JusoAddressSearchAdapter({
      getOrThrow: vi.fn().mockReturnValue('juso-test-key'),
    } as unknown as ConfigService);

    await expect(
      adapter.search(SearchAddressesQuery.of({ keyword: '테헤란로' })),
    ).rejects.toThrow('ADDRESS_SEARCH_FAILED');
  });
});
