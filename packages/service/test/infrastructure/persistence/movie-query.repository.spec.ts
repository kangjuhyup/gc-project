import { describe, expect, it, vi } from 'vitest';
import { ListMoviesQuery } from '@application/query/dto';
import { MikroOrmMovieQueryRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmMovieQueryRepository', () => {
  it('기준 시간과 가까운 상영 순서로 영화 목록을 조회하고 다음 커서를 만든다', async () => {
    const rows = [
      createRow({
        movieId: '1',
        screeningId: '101',
        screeningStartAt: new Date('2026-04-28T01:20:00.000Z'),
        distanceMs: '1200000',
      }),
      createRow({
        movieId: '2',
        screeningId: '201',
        screeningStartAt: new Date('2026-04-28T02:10:00.000Z'),
        distanceMs: '4200000',
      }),
    ];
    const entityManager = {
      execute: vi.fn().mockResolvedValue(rows),
    };
    const repository = new MikroOrmMovieQueryRepository(entityManager as never);

    const result = await repository.list(
      ListMoviesQuery.of({
        time: new Date('2026-04-28T10:30:00+09:00'),
        limit: 1,
        keyword: '파묘',
      }),
    );

    const [sql, params] = entityManager.execute.mock.calls[0] as [string, Array<string | number>];
    expect(sql).toContain('FROM movie_image');
    expect(sql).toContain("movie_image.image_type = 'POSTER'");
    expect(sql).toContain('ORDER BY "distanceMs" ASC, "screeningStartAt" ASC, "screeningId" ASC');
    expect(params).toContain('2026-04-28T01:00:00.000Z');
    expect(params).toContain('%파묘%');
    expect(params.at(-1)).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.screenings[0]?.remainingSeats).toBe(36);
    expect(result.items[0]?.screenings[0]?.theater).toEqual({
      id: 1,
      name: 'GC 시네마 강남',
      address: '서울특별시 강남구 테헤란로 427',
    });
    expect(result.hasNext).toBe(true);
    expect(result.nextCursor).toBeDefined();
  });

  it('커서가 있으면 이전 페이지 마지막 상영 이후 조건을 추가한다', async () => {
    const entityManager = {
      execute: vi.fn().mockResolvedValue([
        createRow({
          movieId: '1',
          screeningId: '101',
          screeningStartAt: new Date('2026-04-28T01:20:00.000Z'),
          distanceMs: '1200000',
        }),
        createRow({
          movieId: '2',
          screeningId: '201',
          screeningStartAt: new Date('2026-04-28T02:10:00.000Z'),
          distanceMs: '4200000',
        }),
      ]),
    };
    const repository = new MikroOrmMovieQueryRepository(entityManager as never);
    const firstPage = await repository.list(
      ListMoviesQuery.of({
        time: new Date('2026-04-28T10:30:00+09:00'),
        limit: 1,
      }),
    );
    entityManager.execute.mockResolvedValueOnce([]);

    await repository.list(
      ListMoviesQuery.of({
        time: new Date('2026-04-28T10:30:00+09:00'),
        limit: 1,
        cursor: firstPage.nextCursor,
      }),
    );

    const [sql, params] = entityManager.execute.mock.calls[1] as [string, Array<string | number>];
    expect(sql).toContain('"distanceMs" > ?');
    expect(params).toContain(1200000);
    expect(params).toContain('2026-04-28T01:20:00.000Z');
    expect(params).toContain(101);
  });

  it('잘못된 영화 목록 커서는 거부한다', async () => {
    const repository = new MikroOrmMovieQueryRepository({ execute: vi.fn() } as never);

    await expect(
      repository.list(
        ListMoviesQuery.of({
          time: new Date('2026-04-28T10:30:00+09:00'),
          cursor: 'invalid-cursor',
        }),
      ),
    ).rejects.toThrow('INVALID_MOVIE_CURSOR');
  });
});

function createRow(params: {
  movieId: string;
  screeningId: string;
  screeningStartAt: Date;
  distanceMs: string;
}) {
  return {
    movieId: params.movieId,
    title: params.movieId === '1' ? '파묘' : '듄: 파트 2',
    genre: params.movieId === '1' ? '미스터리' : 'SF',
    rating: '15',
    runningTime: '134',
    releaseDate: '2024-02-22',
    posterUrl: 'https://example.com/poster.jpg',
    description: '오컬트 미스터리',
    screeningId: params.screeningId,
    theaterId: '1',
    theaterName: 'GC 시네마 강남',
    theaterAddress: '서울특별시 강남구 테헤란로 427',
    screenId: '1',
    screenName: '1관',
    screeningStartAt: params.screeningStartAt,
    screeningEndAt: new Date(params.screeningStartAt.getTime() + 134 * 60 * 1000),
    remainingSeats: '36',
    totalSeats: '80',
    distanceMs: params.distanceMs,
  };
}
