import { apiClient } from '@/lib/apiClient';

export interface MovieScreening {
  id: number;
  screenName: string;
  startAt: string;
  endAt: string;
  remainingSeats: number;
  totalSeats: number;
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
  screenings: MovieScreening[];
}

export interface MovieListResponse {
  items: MovieSummary[];
  hasNext: boolean;
  nextCursor?: string;
}

type MovieListApiResponse = MovieListResponse | MovieSummary[];

export interface FetchMoviesParams {
  keyword: string;
  time: string;
}

export async function fetchMovies(params: FetchMoviesParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', '20');
  searchParams.set('time', params.time);

  if (params.keyword.trim()) {
    searchParams.set('keyword', params.keyword.trim());
  }

  const queryString = searchParams.toString();
  const response = await apiClient<MovieListApiResponse>(
    `/movies${queryString ? `?${queryString}` : ''}`,
  );

  return Array.isArray(response) ? { items: response } : response;
}
