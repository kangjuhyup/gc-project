import { describe, expect, it, vi } from 'vitest';
import { ListMoviesQuery } from '@application/query/dto';
import { MovieController } from '@presentation/http';

describe('MovieController', () => {
  it('영화 목록 조회 요청을 query bus에 위임한다', async () => {
    const expected = {
      items: [],
      hasNext: false,
    };
    const queryBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new MovieController(queryBus as never);

    const result = await controller.list({
      time: '2026-04-28T10:30:00+09:00',
      limit: 10,
      keyword: ' 파묘 ',
      cursor: 'cursor-token',
    } as never);

    expect(queryBus.execute).toHaveBeenCalledWith(
      ListMoviesQuery.of({
        time: new Date('2026-04-28T10:30:00+09:00'),
        limit: 10,
        keyword: '파묘',
        cursor: 'cursor-token',
      }),
    );
    expect(result).toBe(expected);
  });
});
