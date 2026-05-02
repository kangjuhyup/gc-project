import { describe, expect, it, vi } from 'vitest';
import { ListMovieScheduleQuery, ListMoviesQuery } from '@application/query/dto';
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
      limit: 10,
      keyword: ' 파묘 ',
      cursor: 'cursor-token',
    } as never);

    expect(queryBus.execute).toHaveBeenCalledWith(
      ListMoviesQuery.of({
        limit: 10,
        keyword: '파묘',
        cursor: 'cursor-token',
      }),
    );
    expect(result).toBe(expected);
  });

  it('영화별 상영 시간표 조회 요청을 query bus에 위임한다', async () => {
    const expected = {
      movie: { id: 1, title: '파묘' },
      date: '2026-05-01',
      theaters: [],
    };
    const queryBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new MovieController(queryBus as never);

    const result = await controller.listSchedule(
      { movieId: '1' } as never,
      { date: '2026-05-01' } as never,
    );

    expect(queryBus.execute).toHaveBeenCalledWith(
      ListMovieScheduleQuery.of({
        movieId: '1',
        date: '2026-05-01',
      }),
    );
    expect(result).toBe(expected);
  });
});
