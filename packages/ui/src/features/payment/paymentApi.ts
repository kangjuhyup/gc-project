import { apiClient } from '@/lib/apiClient';

export type PaymentMethod = 'CARD' | 'KAKAO_PAY' | 'NAVER_PAY';

export interface PaymentSeat {
  id: string;
  label: string;
}

export interface PaymentRequest {
  screeningId: string;
  seatIds: string[];
  paymentMethod: PaymentMethod;
  totalPrice: number;
}

export interface PaymentResponse {
  reservationNumber: string;
  status: 'CONFIRMED';
  paidAt: string;
}

export function createReservationPayment(payload: PaymentRequest) {
  return apiClient<PaymentResponse>('/reservations', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}
