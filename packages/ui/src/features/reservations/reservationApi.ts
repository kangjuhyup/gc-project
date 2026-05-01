import { apiClient } from '@/lib/apiClient';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'EXPIRED';
type ReservationPaymentStatus =
  | 'PENDING'
  | 'APPROVING'
  | 'APPROVED'
  | 'FAILED'
  | 'REFUND_REQUIRED'
  | 'REFUNDING'
  | 'REFUNDED'
  | 'REFUND_FAILED'
  | 'CANCELED'
  | 'EXPIRED';

export interface ReservationSummary {
  id: string;
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

export interface ReservationDetail extends ReservationSummary {
  paymentAmount?: number;
  payment?: ReservationPaymentSummary;
}

export interface ReservationPaymentSummary {
  id: string;
  status: ReservationPaymentStatus;
  amount: number;
  providerPaymentId?: string;
}

export interface ReservationListResponse {
  items: ReservationSummary[];
  hasNext: boolean;
  nextCursor?: string;
}

interface ReservationListResultDto {
  items: ReservationSummaryDto[];
  hasNext: boolean;
  nextCursor?: string;
}

interface ReservationSummaryDto {
  id: string;
  reservationNumber: string;
  status: ReservationStatus;
  totalPrice: number;
  createdAt: string;
  canceledAt?: string;
  cancelReason?: string;
  movie: ReservationMovieSummaryDto;
  screening: ReservationScreeningSummaryDto;
  seats: ReservationSeatSummaryDto[];
  payment?: ReservationPaymentSummaryDto;
}

interface ReservationDetailDto extends ReservationSummaryDto {
  paymentAmount?: number;
}

interface ReservationMovieSummaryDto {
  id: string;
  title: string;
  rating?: string;
  posterUrl?: string;
}

interface ReservationTheaterSummaryDto {
  id: string;
  name: string;
  address: string;
}

interface ReservationScreeningSummaryDto {
  id: string;
  screenName: string;
  startAt: string;
  endAt: string;
  theater: ReservationTheaterSummaryDto;
}

interface ReservationSeatSummaryDto {
  id: string;
  row: string;
  col: number;
  type: string;
}

interface ReservationPaymentSummaryDto {
  id: string;
  status: ReservationPaymentStatus;
  amount: number;
  providerPaymentId?: string;
}

export interface FetchReservationsParams {
  limit?: number;
  cursor?: string;
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

export async function fetchReservations({ limit = 20, cursor }: FetchReservationsParams = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await apiClient<ReservationListResultDto>(`/reservations?${params}`);

  return {
    items: response.items.map(mapReservationSummary),
    hasNext: response.hasNext,
    nextCursor: response.nextCursor,
  };
}

export async function fetchReservationDetail(reservationId: string) {
  const response = await apiClient<ReservationDetailDto>(
    `/reservations/${encodeURIComponent(reservationId)}`,
  );

  return mapReservationDetail(response);
}

export function cancelReservation(reservationId: string, payload: CancelReservationRequestDto) {
  return apiClient<ReservationCanceledDto>(
    `/reservations/${encodeURIComponent(reservationId)}/cancel`,
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
  );
}

function mapReservationDetail(reservation: ReservationDetailDto): ReservationDetail {
  return {
    ...mapReservationSummary(reservation),
    paymentAmount: reservation.paymentAmount,
    payment: reservation.payment,
  };
}

function mapReservationSummary(reservation: ReservationSummaryDto): ReservationSummary {
  return {
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    status: reservation.status,
    totalPrice: reservation.totalPrice,
    createdAt: reservation.createdAt,
    movieTitle: reservation.movie.title,
    posterUrl: reservation.movie.posterUrl ?? '',
    screeningStartAt: reservation.screening.startAt,
    screenName: reservation.screening.screenName,
    seats: reservation.seats.map((seat) => `${seat.row}${seat.col}`),
    canceledAt: reservation.canceledAt,
    cancelReason: reservation.cancelReason,
  };
}
