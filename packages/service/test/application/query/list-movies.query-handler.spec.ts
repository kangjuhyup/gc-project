import { describe, expect, it, vi } from 'vitest';
import { ListMoviesQuery, MovieListResultDto, MovieSummaryDto } from '@application/query/dto';
import { ListMoviesQueryHandler } from '@application/query/handlers';
import type { MovieQueryPort } from '@application/query/ports';

describe('ListMoviesQueryHandler', () => {
  it('영화 목록 요청을 query port에 위임한다', async () => {
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
        }),
      ],
      hasNext: false,
    });
    const movieQuery = {
      list: vi.fn().mockResolvedValue(expected),
      listAdminMovies: vi.fn(),
    } satisfies MovieQueryPort;
    const handler = new ListMoviesQueryHandler(movieQuery);
    const query = ListMoviesQuery.of({
      limit: 20,
    });

    const result = await handler.execute(query);

    expect(movieQuery.list).toHaveBeenCalledWith(query);
    expect(result).toBe(expected);
  });
});
