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

export interface CancelReservationRequestDto {
  reason?: string;
}

export interface ReservationCanceledDto {
  reservationId: string;
  paymentId: string;
  reservationStatus: 'CANCELED';
  paymentStatus: 'REFUND_REQUIRED' | 'REFUNDING' | 'REFUNDED' | 'REFUND_FAILED';
  reason?: string;
}

export function fetchReservations(memberId: number) {
  const params = new URLSearchParams({
    memberId: String(memberId),
  });

  return apiClient<ReservationListResponse>(`/reservations?${params}`);
}

export function cancelReservation(reservationId: number, payload: CancelReservationRequestDto) {
  return apiClient<ReservationCanceledDto>(
    `/reservations/${encodeURIComponent(String(reservationId))}/cancel`,
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
  );
}
