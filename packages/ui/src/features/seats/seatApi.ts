import { apiClient } from '@/lib/apiClient';

export type SeatStatus = 'AVAILABLE' | 'HELD' | 'RESERVED';
export type SeatId = string;

export interface SeatSummary {
  id: SeatId;
  label: string;
  row: string;
  col: number;
  type: 'NORMAL' | 'COUPLE' | 'DISABLED';
  status: SeatStatus;
}

export interface ScreeningSeatMapResponse {
  screening: {
    id: SeatId;
    movieTitle: string;
    screenName: string;
    startAt: string;
    endAt: string;
    price: number;
  };
  seats: SeatSummary[];
}

interface ScreeningSeatListApiResponse {
  screeningId: string;
  seats: Array<{
    id: string;
    row: string;
    col: number;
    type: SeatSummary['type'];
    status: SeatStatus;
  }>;
}

export interface SeatHoldRequest {
  screeningId: SeatId;
  seatIds: SeatId[];
}

export interface SeatHoldResponse {
  screeningId: SeatId;
  seatIds: SeatId[];
  holdIds: string[];
  ttlSeconds: number;
  expiresAt: string;
}

export interface SeatHoldReleaseResponse {
  holdId: string;
  released: boolean;
}

export function fetchScreeningSeats(screeningId: number) {
  return apiClient<ScreeningSeatListApiResponse>(`/screenings/${screeningId}/seats`).then(
    (response) => ({
      screening: {
        id: response.screeningId,
        movieTitle: `상영 ${response.screeningId}`,
        screenName: '상영관',
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
        price: 14000,
      },
      seats: response.seats.map((seat) => ({
        ...seat,
        label: `${seat.row}${seat.col}`,
      })),
    }),
  );
}

export function createSeatHold(payload: SeatHoldRequest) {
  return apiClient<SeatHoldResponse>('/seat-holds', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function releaseSeatHold(holdId: string, options: Pick<RequestInit, 'keepalive'> = {}) {
  return apiClient<SeatHoldReleaseResponse>(`/seat-holds/${holdId}`, {
    keepalive: options.keepalive,
    method: 'DELETE',
  });
}
