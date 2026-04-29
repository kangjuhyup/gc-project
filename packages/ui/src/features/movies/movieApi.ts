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

export async function fetchMovies(keyword: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', '20');

  if (keyword.trim()) {
    searchParams.set('keyword', keyword.trim());
  }

  const queryString = searchParams.toString();
  const response = await apiClient<MovieListApiResponse>(
    `/movies${queryString ? `?${queryString}` : ''}`,
  );

  return Array.isArray(response) ? { items: response } : response;
}
