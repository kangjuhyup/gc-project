import { apiClient } from '@/lib/apiClient';

export type PaymentMethod = 'CARD' | 'KAKAO_PAY' | 'NAVER_PAY';
export type PaymentProvider = 'LOCAL' | 'KAKAO' | 'TOSS' | 'NAVER';

export interface PaymentSeat {
  id: string;
  label: string;
}

export interface RequestPaymentRequestDto {
  seatHoldId: string;
  idempotencyKey: string;
  provider: PaymentProvider;
  amount: number;
}

export interface PaymentResultDto {
  paymentId: string;
  seatHoldId: string;
  idempotencyKey: string;
  reservationId?: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  status:
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

export function mapPaymentMethodToProvider(paymentMethod: PaymentMethod): PaymentProvider {
  if (paymentMethod === 'KAKAO_PAY') {
    return 'KAKAO';
  }

  if (paymentMethod === 'NAVER_PAY') {
    return 'NAVER';
  }

  return 'LOCAL';
}

export function createPaymentIdempotencyKey(seatHoldId: string) {
  return `pay-${seatHoldId}-${crypto.randomUUID()}`;
}
