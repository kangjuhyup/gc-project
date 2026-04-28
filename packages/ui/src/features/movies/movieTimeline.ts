import { type MovieScreening, type MovieSummary } from './movieApi';

export interface TimelineMovie extends MovieSummary {
  nextScreening: MovieScreening;
}

export interface TimelineGroup {
  dateKey: string;
  label: string;
  movies: TimelineMovie[];
}

export const demoMovies: MovieSummary[] = [
  {
    id: 1,
    title: '파묘',
    genre: '미스터리',
    rating: '15',
    runningTime: 134,
    releaseDate: '2024-02-22',
    posterUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=560&q=80',
    description: '기묘한 의뢰를 받은 사람들이 오래된 비밀을 마주하는 오컬트 미스터리.',
    screenings: [
      createScreening(101, '1관', '2026-04-28T10:30:00+09:00', 36),
      createScreening(102, '2관', '2026-04-28T18:20:00+09:00', 18),
    ],
  },
  {
    id: 2,
    title: '듄: 파트 2',
    genre: 'SF',
    rating: '12',
    runningTime: 166,
    releaseDate: '2024-02-28',
    posterUrl:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=560&q=80',
    description: '거대한 사막 행성에서 펼쳐지는 운명과 선택의 서사.',
    screenings: [
      createScreening(201, 'IMAX', '2026-04-28T13:10:00+09:00', 9),
      createScreening(202, 'IMAX', '2026-04-29T20:40:00+09:00', 42),
    ],
  },
  {
    id: 3,
    title: '인사이드 아웃 2',
    genre: '애니메이션',
    rating: 'ALL',
    runningTime: 96,
    releaseDate: '2024-06-12',
    posterUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=560&q=80',
    description: '새로운 감정들이 등장하며 더 넓어진 마음의 세계를 탐험한다.',
    screenings: [
      createScreening(301, '3관', '2026-04-29T09:50:00+09:00', 55),
      createScreening(302, '4관', '2026-04-29T16:30:00+09:00', 24),
    ],
  },
  {
    id: 4,
    title: '괴물',
    genre: '드라마',
    rating: '12',
    runningTime: 126,
    releaseDate: '2023-11-29',
    posterUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=560&q=80',
    description: '엇갈린 시선 속에서 한 사건의 진실을 따라가는 섬세한 드라마.',
    screenings: [
      createScreening(401, '아트관', '2026-04-30T11:20:00+09:00', 14),
      createScreening(402, '아트관', '2026-04-30T19:00:00+09:00', 7),
    ],
  },
];

export function filterMoviesForKeyword(movies: MovieSummary[], keyword: string) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();

  if (!normalizedKeyword) {
    return movies;
  }

  return movies.filter((movie) =>
    [movie.title, movie.genre, movie.rating, movie.description]
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedKeyword),
  );
}

export function groupMoviesByTimeline(movies: MovieSummary[]) {
  const timelineMovies = movies
    .map((movie) => {
      const nextScreening = getNextScreening(movie.screenings);

      if (!nextScreening) {
        return null;
      }

      return {
        ...movie,
        nextScreening,
      };
    })
    .filter((movie): movie is TimelineMovie => Boolean(movie))
    .sort(
      (first, second) =>
        new Date(first.nextScreening.startAt).getTime() -
        new Date(second.nextScreening.startAt).getTime(),
    );

  return timelineMovies.reduce<TimelineGroup[]>((groups, movie) => {
    const dateKey = movie.nextScreening.startAt.slice(0, 10);
    const existingGroup = groups.find((group) => group.dateKey === dateKey);

    if (existingGroup) {
      existingGroup.movies.push(movie);
      return groups;
    }

    groups.push({
      dateKey,
      label: formatTimelineDate(movie.nextScreening.startAt),
      movies: [movie],
    });

    return groups;
  }, []);
}

export function formatScreeningTime(startAt: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(startAt));
}

function createScreening(
  id: number,
  screenName: string,
  startAt: string,
  remainingSeats: number,
): MovieScreening {
  const startDate = new Date(startAt);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  return {
    id,
    screenName,
    startAt,
    endAt: endDate.toISOString(),
    remainingSeats,
    totalSeats: 80,
  };
}

function getNextScreening(screenings: MovieScreening[]) {
  return [...screenings].sort(
    (first, second) => new Date(first.startAt).getTime() - new Date(second.startAt).getTime(),
  )[0];
}

function formatTimelineDate(startAt: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(startAt));
}
