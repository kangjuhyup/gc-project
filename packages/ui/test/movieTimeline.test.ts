import { describe, expect, it } from 'vitest';
import { filterMoviesForKeyword, groupMoviesByTimeline } from '@/features/movies/movieTimeline';
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
      },
    ],
  },
];

describe('movie timeline', () => {
  it('filters movies by keyword', () => {
    expect(filterMoviesForKeyword(movies, 'sf')).toHaveLength(1);
    expect(filterMoviesForKeyword(movies, '미스터리')[0]?.title).toBe('파묘');
  });

  it('groups movies by next screening date in timeline order', () => {
    const groups = groupMoviesByTimeline(movies);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.dateKey).toBe('2026-04-28');
    expect(groups[0]?.movies[0]?.title).toBe('파묘');
    expect(groups[1]?.dateKey).toBe('2026-04-29');
  });
});
