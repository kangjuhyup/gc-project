import { apiClient } from '@/lib/apiClient';

export type PaymentMethod = 'CARD' | 'KAKAO_PAY' | 'NAVER_PAY';
export type PaymentProvider = 'LOCAL' | 'KAKAO' | 'TOSS' | 'NAVER';
export type PaymentStatus =
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

export interface PaymentSeat {
  id: string;
  label: string;
}

export interface RequestPaymentRequestDto {
  seatHoldIds: string[];
  idempotencyKey: string;
  provider: PaymentProvider;
  amount: number;
}

export interface PaymentResultDto {
  paymentId: string;
  seatHoldId: string;
  seatHoldIds: string[];
  idempotencyKey: string;
  reservationId?: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  status: PaymentStatus;
  amount: number;
  approvalUrl?: string;
  expiresAt?: string;
}

export function requestPayment(payload: RequestPaymentRequestDto) {
  return apiClient<PaymentResultDto>('/payments', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function fetchPayment(paymentId: string) {
  return apiClient<PaymentResultDto>(`/payments/${encodeURIComponent(paymentId)}`);
}

export function mapPaymentMethodToProvider(paymentMethod: PaymentMethod): PaymentProvider {
  if (paymentMethod === 'KAKAO_PAY') {
    return 'KAKAO';
  }

  if (paymentMethod === 'NAVER_PAY') {
    return 'NAVER';
  }

  return 'LOCAL';
}

export function createPaymentIdempotencyKey(seatHoldIds: string[]) {
  return `pay-${seatHoldIds.join('-')}-${crypto.randomUUID()}`;
}
