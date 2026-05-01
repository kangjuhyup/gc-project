import { describe, expect, it, vi } from 'vitest';
import { AdminMovieListResultDto, ListAdminMoviesQuery } from '@application/query/dto';
import { ListAdminMoviesQueryHandler } from '@application/query/handlers';
import type { MovieQueryPort } from '@application/query/ports';

describe('ListAdminMoviesQueryHandler', () => {
  it('관리자 영화 목록 조회를 movie query port에 위임한다', async () => {
    const resultDto = AdminMovieListResultDto.of({
      items: [],
      hasNext: false,
    });
    const movieQuery = {
      list: vi.fn(),
      listAdminMovies: vi.fn().mockResolvedValue(resultDto),
    } satisfies MovieQueryPort;
    const handler = new ListAdminMoviesQueryHandler(movieQuery);
    const query = ListAdminMoviesQuery.of({
      limit: 10,
      keyword: '관리자',
      cursor: 'next-cursor',
    });

    const result = await handler.execute(query);

    expect(movieQuery.listAdminMovies).toHaveBeenCalledWith(query);
    expect(result).toBe(resultDto);
  });
});
