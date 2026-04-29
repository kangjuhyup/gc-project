import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PaymentProviderType, PaymentStatusType } from '@domain';

export class PaymentResultDto {
  @ApiProperty({ example: '7001', description: '결제 ID' })
  readonly paymentId: string;

  @ApiProperty({ example: '9001', description: '좌석 임시점유 ID' })
  readonly seatHoldId: string;

  @ApiProperty({ example: 'pay-20260429-0001', description: '결제 요청 멱등성 키' })
  readonly idempotencyKey: string;

  @ApiPropertyOptional({ example: '5001', description: '결제 완료 후 연결된 예매 ID' })
  readonly reservationId?: string;

  @ApiProperty({ example: 'LOCAL', description: '결제 provider' })
  readonly provider: PaymentProviderType;

  @ApiPropertyOptional({ example: 'local-7001-20260429120000', description: 'provider 결제 ID' })
  readonly providerPaymentId?: string;

  @ApiProperty({ example: 'PENDING', description: '결제 상태' })
  readonly status: PaymentStatusType;

  @ApiProperty({ example: 30000, description: '결제 금액' })
  readonly amount: number;

  @ApiPropertyOptional({ example: 'http://localhost:4000/local-payment/7001', description: 'PG 승인 URL. local adapter는 생략 가능' })
  readonly approvalUrl?: string;

  @ApiPropertyOptional({ example: '2026-04-29T01:10:00.000Z', description: '결제 만료 시각' })
  readonly expiresAt?: Date;

  private constructor(params: {
    paymentId: string;
    seatHoldId: string;
    idempotencyKey: string;
    reservationId?: string;
    provider: PaymentProviderType;
    providerPaymentId?: string;
    status: PaymentStatusType;
    amount: number;
    approvalUrl?: string;
    expiresAt?: Date;
  }) {
    this.paymentId = params.paymentId;
    this.seatHoldId = params.seatHoldId;
    this.idempotencyKey = params.idempotencyKey;
    this.reservationId = params.reservationId;
    this.provider = params.provider;
    this.providerPaymentId = params.providerPaymentId;
    this.status = params.status;
    this.amount = params.amount;
    this.approvalUrl = params.approvalUrl;
    this.expiresAt = params.expiresAt;
  }

  static of(params: {
    paymentId: string;
    seatHoldId: string;
    idempotencyKey: string;
    reservationId?: string;
    provider: PaymentProviderType;
    providerPaymentId?: string;
    status: PaymentStatusType;
    amount: number;
    approvalUrl?: string;
    expiresAt?: Date;
  }): PaymentResultDto {
    return new PaymentResultDto(params);
  }
}
