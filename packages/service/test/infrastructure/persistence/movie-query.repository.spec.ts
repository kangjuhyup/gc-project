import { describe, expect, it, vi } from 'vitest';
import { ListMoviesQuery } from '@application/query/dto';
import { MikroOrmMovieQueryRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmMovieQueryRepository', () => {
  it('기준 시간과 가까운 상영 순서로 영화 목록을 조회하고 다음 커서를 만든다', async () => {
    const screenings = [
      createScreening({
        movieId: '1',
        screeningId: '101',
        screeningStartAt: new Date('2026-04-28T01:20:00.000Z'),
      }),
      createScreening({
        movieId: '2',
        screeningId: '201',
        screeningStartAt: new Date('2026-04-28T02:10:00.000Z'),
      }),
    ];
    const entityManager = {
      find: vi.fn().mockResolvedValue(screenings),
    };
    const repository = new MikroOrmMovieQueryRepository(entityManager as never);

    const result = await repository.list(
      ListMoviesQuery.of({
        time: new Date('2026-04-28T10:30:00+09:00'),
        limit: 1,
        keyword: '파묘',
      }),
    );

    expect(entityManager.find).toHaveBeenCalledWith(expect.any(Function), {
      movie: {
        $or: [
          { title: { $ilike: '%파묘%' } },
          { genre: { $ilike: '%파묘%' } },
          { rating: { $ilike: '%파묘%' } },
          { description: { $ilike: '%파묘%' } },
        ],
      },
    }, {
      populate: [
        'movie.images',
        'screen.theater',
        'reservationSeats.reservation',
      ],
      orderBy: { startAt: 'ASC', id: 'ASC' },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.screenings[0]?.remainingSeats).toBe(79);
    expect(result.items[0]?.screenings[0]?.theater).toEqual({
      id: 1,
      name: 'GC 시네마 강남',
      address: '서울특별시 강남구 테헤란로 427',
    });
    expect(result.hasNext).toBe(true);
    expect(result.nextCursor).toBeDefined();
  });

  it('커서가 있으면 이전 페이지 마지막 상영 이후 조건을 추가한다', async () => {
    const screenings = [
      createScreening({
        movieId: '1',
        screeningId: '101',
        screeningStartAt: new Date('2026-04-28T01:20:00.000Z'),
      }),
      createScreening({
        movieId: '2',
        screeningId: '201',
        screeningStartAt: new Date('2026-04-28T02:10:00.000Z'),
      }),
    ];
    const entityManager = {
      find: vi.fn().mockResolvedValue(screenings),
    };
    const repository = new MikroOrmMovieQueryRepository(entityManager as never);
    const firstPage = await repository.list(
      ListMoviesQuery.of({
        time: new Date('2026-04-28T10:30:00+09:00'),
        limit: 1,
      }),
    );

    const secondPage = await repository.list(
      ListMoviesQuery.of({
        time: new Date('2026-04-28T10:30:00+09:00'),
        limit: 1,
        cursor: firstPage.nextCursor,
      }),
    );

    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.id).toBe(2);
  });

  it('잘못된 영화 목록 커서는 거부한다', async () => {
    const repository = new MikroOrmMovieQueryRepository({ find: vi.fn() } as never);

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

function createScreening(params: {
  movieId: string;
  screeningId: string;
  screeningStartAt: Date;
}) {
  const movie = {
    id: params.movieId,
    title: params.movieId === '1' ? '파묘' : '듄: 파트 2',
    genre: params.movieId === '1' ? '미스터리' : 'SF',
    rating: '15',
    runningTime: 134,
    releaseDate: new Date('2024-02-22T00:00:00.000Z'),
    posterUrl: 'https://example.com/fallback-poster.jpg',
    description: '오컬트 미스터리',
    images: collection([
      {
        id: '1',
        imageType: 'POSTER',
        url: 'https://example.com/poster.jpg',
        sortOrder: 0,
      },
    ]),
  };
  const screen = {
    id: '1',
    name: '1관',
    totalSeats: 80,
    theater: {
      id: '1',
      name: 'GC 시네마 강남',
      address: '서울특별시 강남구 테헤란로 427',
    },
  };

  return {
    id: params.screeningId,
    movie,
    screen,
    startAt: params.screeningStartAt,
    endAt: new Date(params.screeningStartAt.getTime() + 134 * 60 * 1000),
    reservationSeats: collection([
      {
        reservation: { status: 'CONFIRMED' },
      },
    ]),
  };
}

function collection<T>(items: T[]) {
  return {
    getItems: () => items,
  };
}
