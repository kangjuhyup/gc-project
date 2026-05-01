import { describe, expect, it, vi } from 'vitest';
import { AdminMovieListResultDto, ListAdminMoviesQuery } from '@application/query/dto';
import { ListAdminMoviesQueryHandler } from '@application/query/handlers';
import type { MovieQueryPort } from '@application/query/ports';

describe('ListAdminMoviesQueryHandler', () => {
  it('관리자 영화 목록 조회를 movie query port에 위임한다', async () => {
    const resultDto = AdminMovieListResultDto.of({
      totalCount: 0,
      currentPage: 1,
      countPerPage: 10,
      items: [],
    });
    const movieQuery = {
      list: vi.fn(),
      listAdminMovies: vi.fn().mockResolvedValue(resultDto),
    } satisfies MovieQueryPort;
    const handler = new ListAdminMoviesQueryHandler(movieQuery);
    const query = ListAdminMoviesQuery.of({
      currentPage: 2,
      countPerPage: 10,
      keyword: '관리자',
    });

    const result = await handler.execute(query);

    expect(movieQuery.listAdminMovies).toHaveBeenCalledWith(query);
    expect(result).toBe(resultDto);
  });
});
