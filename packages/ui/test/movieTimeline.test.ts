import { describe, expect, it } from 'vitest';
import {
  filterMoviesForKeyword,
  filterMoviesForTheater,
  groupMoviesByTimeline,
} from '@/features/movies/movieTimeline';
import { type MovieSummary } from '@/features/movies/movieApi';

const movies: MovieSummary[] = [
  {
    id: 1,
    title: '듄',
    genre: 'SF',
    rating: '12',
    runningTime: 166,
    releaseDate: '2024-02-28',
    posterUrl: '',
    description: '사막 행성의 전쟁',
    screenings: [
      {
        id: 11,
        screenName: 'IMAX',
        startAt: '2026-04-29T20:40:00+09:00',
        endAt: '2026-04-29T23:26:00+09:00',
        remainingSeats: 10,
        totalSeats: 80,
        price: 14000,
        theater: {
          id: 1,
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
        },
      },
    ],
  },
  {
    id: 2,
    title: '파묘',
    genre: '미스터리',
    rating: '15',
    runningTime: 134,
    releaseDate: '2024-02-22',
    posterUrl: '',
    description: '오컬트 미스터리',
    screenings: [
      {
        id: 21,
        screenName: '1관',
        startAt: '2026-04-28T10:30:00+09:00',
        endAt: '2026-04-28T12:44:00+09:00',
        remainingSeats: 20,
        totalSeats: 80,
        price: 14000,
        theater: {
          id: 1,
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
        },
      },
    ],
  },
];

describe('movie timeline', () => {
  it('키워드로 영화 목록을 필터링한다', () => {
    expect(filterMoviesForKeyword(movies, 'sf')).toHaveLength(1);
    expect(filterMoviesForKeyword(movies, '미스터리')[0]?.title).toBe('파묘');
  });

  it('다음 상영일 기준으로 영화를 타임라인 순서로 그룹화한다', () => {
    const groups = groupMoviesByTimeline(movies);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.dateKey).toBe('2026-04-28');
    expect(groups[0]?.movies[0]?.title).toBe('파묘');
    expect(groups[1]?.dateKey).toBe('2026-04-29');
  });

  it('선택한 영화관의 상영만 남기고 영화 목록을 필터링한다', () => {
    const filtered = filterMoviesForTheater([
      {
        ...movies[0],
        screenings: [
          movies[0].screenings[0],
          {
            ...movies[0].screenings[0],
            id: 12,
            theater: {
              id: 2,
              name: 'GC 시네마 홍대',
              address: '서울특별시 마포구 양화로 160',
            },
          },
        ],
      },
      {
        ...movies[1],
        screenings: [{
          ...movies[1].screenings[0],
          theater: {
            id: 2,
            name: 'GC 시네마 홍대',
            address: '서울특별시 마포구 양화로 160',
          },
        }],
      },
    ], 1);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
    expect(filtered[0].screenings).toEqual([
      expect.objectContaining({
        id: 11,
        theater: expect.objectContaining({ id: 1 }),
      }),
    ]);
  });
});
