import { describe, expect, it, vi } from 'vitest';
import {
  ListMoviesQuery,
  MovieListResultDto,
  MovieScreeningSummaryDto,
  MovieSummaryDto,
  MovieTheaterSummaryDto,
} from '@application/query/dto';
import { ListMoviesQueryHandler } from '@application/query/handlers';
import type { MovieQueryPort } from '@application/query/ports';

describe('ListMoviesQueryHandler', () => {
  it('영화 목록 요청 시간을 정시로 보정한 뒤 query port에 위임한다', async () => {
    const expected = MovieListResultDto.of({
      items: [
        MovieSummaryDto.of({
          id: 1,
          title: '파묘',
          genre: '미스터리',
          rating: '15',
          runningTime: 134,
          releaseDate: '2024-02-22',
          posterUrl: 'https://example.com/poster.jpg',
          description: '오컬트 미스터리',
          screenings: [
            MovieScreeningSummaryDto.of({
              id: 101,
              screenName: '1관',
              startAt: '2026-04-28T01:20:00.000Z',
              endAt: '2026-04-28T03:34:00.000Z',
              remainingSeats: 36,
              totalSeats: 80,
              theater: MovieTheaterSummaryDto.of({
                id: 1,
                name: 'GC 시네마 강남',
                address: '서울특별시 강남구 테헤란로 427',
              }),
            }),
          ],
        }),
      ],
      hasNext: false,
    });
    const movieQuery = {
      list: vi.fn().mockResolvedValue(expected),
    } satisfies MovieQueryPort;
    const handler = new ListMoviesQueryHandler(movieQuery);
    const query = ListMoviesQuery.of({
      time: new Date('2026-04-28T10:30:00+09:00'),
      limit: 20,
    });

    const result = await handler.execute(query);

    expect(movieQuery.list).toHaveBeenCalledWith(query);
    expect(query.time.toISOString()).toBe('2026-04-28T01:00:00.000Z');
    expect(result).toBe(expected);
  });
});
