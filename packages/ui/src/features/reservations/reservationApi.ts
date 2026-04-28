import { apiClient } from '@/lib/apiClient';

export type ReservationStatus = 'CONFIRMED' | 'CANCELED' | 'EXPIRED';

export interface ReservationSummary {
  id: number;
  reservationNumber: string;
  status: ReservationStatus;
  totalPrice: number;
  createdAt: string;
  movieTitle: string;
  posterUrl: string;
  screeningStartAt: string;
  screenName: string;
  seats: string[];
  canceledAt?: string;
  cancelReason?: string;
}

export interface ReservationListResponse {
  items: ReservationSummary[];
}

export function fetchReservations(memberId: number) {
  const params = new URLSearchParams({
    memberId: String(memberId),
  });

  return apiClient<ReservationListResponse>(`/reservations?${params}`);
}
