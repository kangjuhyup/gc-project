import { apiClient } from '@/lib/apiClient';

export type SeatStatus = 'AVAILABLE' | 'HELD' | 'RESERVED';

export interface SeatSummary {
  id: number;
  label: string;
  row: string;
  col: number;
  type: 'NORMAL' | 'COUPLE' | 'DISABLED';
  status: SeatStatus;
}

export interface ScreeningSeatMapResponse {
  screening: {
    id: number;
    movieTitle: string;
    screenName: string;
    startAt: string;
    endAt: string;
    price: number;
  };
  seats: SeatSummary[];
}

export function fetchScreeningSeats(screeningId: number) {
  return apiClient<ScreeningSeatMapResponse>(`/screenings/${screeningId}/seats`);
}
