import { apiClient } from '@/lib/apiClient';

export interface MovieScreening {
  id: number;
  screenName: string;
  startAt: string;
  endAt: string;
  remainingSeats: number;
  totalSeats: number;
  price: number;
  theater: {
    id: number;
    name: string;
    address: string;
  };
}

export interface MovieSummary {
  id: number;
  title: string;
  genre: string;
  rating: string;
  runningTime: number;
  releaseDate: string;
  posterUrl: string;
  description: string;
  screenings?: MovieScreening[];
}

export interface MovieListResponse {
  items: MovieSummary[];
  hasNext: boolean;
  nextCursor?: string;
}

type MovieListApiResponse = MovieListResponse | MovieSummary[];

export interface FetchMoviesParams {
  cursor?: string;
  keyword: string;
  limit?: number;
}

export type ScheduleScreening = Omit<MovieScreening, 'theater'>;

export interface MovieScheduleTheater {
  theater: {
    id: number;
    name: string;
    address: string;
  };
  screenings: ScheduleScreening[];
}

export interface MovieScheduleResult {
  movie: Omit<MovieSummary, 'releaseDate' | 'description' | 'screenings'>;
  date: string;
  theaters: MovieScheduleTheater[];
}

export async function fetchMovies({ cursor, keyword, limit = 20 }: FetchMoviesParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(limit));

  if (keyword.trim()) {
    searchParams.set('keyword', keyword.trim());
  }

  if (cursor) {
    searchParams.set('cursor', cursor);
  }

  const queryString = searchParams.toString();
  const response = await apiClient<MovieListApiResponse>(
    `/movies${queryString ? `?${queryString}` : ''}`,
  );

  return Array.isArray(response) ? { items: response, hasNext: false } : response;
}

export function fetchMovieSchedules(movieId: number, date: string) {
  const params = new URLSearchParams({ date });

  return apiClient<MovieScheduleResult>(
    `/movies/${encodeURIComponent(String(movieId))}/schedules?${params}`,
  );
}
