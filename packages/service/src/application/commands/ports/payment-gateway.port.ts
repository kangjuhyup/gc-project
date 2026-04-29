import type { PaymentProviderType } from '@domain';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface PaymentGatewayRequestResultDto {
  readonly provider: PaymentProviderType;
  readonly providerPaymentId?: string;
  readonly approvalUrl?: string;
  readonly expiresAt?: Date;
}

export interface PaymentRefundRequestDto {
  readonly paymentId: string;
  readonly provider: PaymentProviderType;
  readonly providerPaymentId: string;
  readonly amount: number;
}

export interface PaymentRefundResultDto {
  readonly refunded: boolean;
  readonly reason?: string;
}

export interface PaymentGatewayPort {
  request(params: {
    paymentId: string;
    provider: PaymentProviderType;
    amount: number;
  }): Promise<PaymentGatewayRequestResultDto>;
  refund(params: PaymentRefundRequestDto): Promise<PaymentRefundResultDto>;
}
