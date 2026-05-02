import { apiClient } from '@/lib/apiClient';
import type { ScheduleScreening } from './movieApi';

export interface TheaterSummary {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
}

export interface TheaterScheduleMovie {
  id: number;
  title: string;
  genre: string;
  rating: string;
  runningTime: number;
  posterUrl: string;
  screenings: ScheduleScreening[];
}

export interface TheaterScheduleResult {
  theater: Pick<TheaterSummary, 'id' | 'name' | 'address'>;
  date: string;
  movies: TheaterScheduleMovie[];
}

interface TheaterListResultDto {
  items: TheaterSummary[];
}

export async function fetchTheaters() {
  return apiClient<TheaterListResultDto>('/theaters');
}

export function fetchTheaterSchedules(theaterId: number, date: string) {
  const params = new URLSearchParams({ date });

  return apiClient<TheaterScheduleResult>(
    `/theaters/${encodeURIComponent(String(theaterId))}/schedules?${params}`,
  );
}
