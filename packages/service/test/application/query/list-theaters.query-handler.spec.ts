import { describe, expect, it, vi } from 'vitest';
import { ListTheatersQuery, TheaterListResultDto, TheaterSummaryDto } from '@application/query/dto';
import { ListTheatersQueryHandler } from '@application/query/handlers';
import type { TheaterQueryPort } from '@application/query/ports';

describe('ListTheatersQueryHandler', () => {
  it('영화관 목록 요청을 query port에 위임한다', async () => {
    const expected = TheaterListResultDto.of({
      items: [
        TheaterSummaryDto.of({
          id: 1,
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
          latitude: 37.5065,
          longitude: 127.053,
          distanceMeters: 120,
        }),
      ],
    });
    const theaterQuery = {
      list: vi.fn().mockResolvedValue(expected),
    } satisfies TheaterQueryPort;
    const handler = new ListTheatersQueryHandler(theaterQuery);
    const query = ListTheatersQuery.of({ latitude: 37.5, longitude: 127.05 });

    const result = await handler.execute(query);

    expect(theaterQuery.list).toHaveBeenCalledWith(query);
    expect(result).toBe(expected);
  });
});
