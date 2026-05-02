import { describe, expect, it, vi } from 'vitest';
import { ListMovieScheduleQuery, ListMoviesQuery } from '@application/query/dto';
import { MikroOrmMovieQueryRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmMovieQueryRepository', () => {
  it('영화 마스터 목록을 조회하고 다음 커서를 만든다', async () => {
    const entityManager = {
      find: vi.fn().mockResolvedValue([
        createMovie({ movieId: '1', title: '파묘' }),
        createMovie({ movieId: '2', title: '듄: 파트 2' }),
      ]),
    };
    const repository = new MikroOrmMovieQueryRepository(entityManager as never);

    const result = await repository.list(
      ListMoviesQuery.of({
        limit: 1,
        keyword: '파묘',
      }),
    );

    expect(entityManager.find).toHaveBeenCalledWith(expect.any(Function), {
      $or: [
        { title: { $ilike: '%파묘%' } },
        { director: { $ilike: '%파묘%' } },
        { genre: { $ilike: '%파묘%' } },
        { rating: { $ilike: '%파묘%' } },
        { description: { $ilike: '%파묘%' } },
      ],
    }, {
      populate: ['images'],
      orderBy: { title: 'ASC', id: 'ASC' },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('파묘');
    expect(result.hasNext).toBe(true);
    expect(result.nextCursor).toBeDefined();
  });

  it('커서가 있으면 이전 페이지 마지막 영화 이후 목록을 조회한다', async () => {
    const entityManager = {
      find: vi.fn().mockResolvedValue([
        createMovie({ movieId: '1', title: '파묘' }),
        createMovie({ movieId: '2', title: '해바라기' }),
      ]),
    };
    const repository = new MikroOrmMovieQueryRepository(entityManager as never);
    const firstPage = await repository.list(
      ListMoviesQuery.of({
        limit: 1,
      }),
    );

    const secondPage = await repository.list(
      ListMoviesQuery.of({
        limit: 1,
        cursor: firstPage.nextCursor,
      }),
    );

    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.id).toBe(2);
  });

  it('영화별 상영시간표를 영화관과 상영관 기준으로 묶어 조회한다', async () => {
    const movie = createMovie({ movieId: '1', title: '파묘' });
    const entityManager = {
      findOne: vi.fn().mockResolvedValue(movie),
      find: vi.fn().mockResolvedValue([
        createScreening({
          movieId: '1',
          screeningId: '101',
          screeningStartAt: new Date('2026-05-01T01:00:00.000Z'),
        }),
      ]),
    };
    const repository = new MikroOrmMovieQueryRepository(entityManager as never);

    const result = await repository.listSchedule(
      ListMovieScheduleQuery.of({ movieId: '1', date: '2026-05-01' }),
    );

    expect(entityManager.findOne).toHaveBeenCalledWith(expect.any(Function), { id: '1' }, { populate: ['images'] });
    expect(entityManager.find).toHaveBeenCalledWith(expect.any(Function), {
      movie: '1',
      startAt: {
        $gte: new Date('2026-04-30T15:00:00.000Z'),
        $lt: new Date('2026-05-01T15:00:00.000Z'),
      },
    }, expect.any(Object));
    expect(result.movie.title).toBe('파묘');
    expect(result.theaters[0]?.theater.name).toBe('GC 시네마 강남');
    expect(result.theaters[0]?.screenings[0]?.screenName).toBe('1관');
  });

  it('잘못된 영화 목록 커서는 거부한다', async () => {
    const repository = new MikroOrmMovieQueryRepository({ find: vi.fn() } as never);

    await expect(
      repository.list(
        ListMoviesQuery.of({
          cursor: 'invalid-cursor',
        }),
      ),
    ).rejects.toThrow('INVALID_MOVIE_CURSOR');
  });
});

function createMovie(params: { movieId: string; title: string }) {
  return {
    id: params.movieId,
    title: params.title,
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
}

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
