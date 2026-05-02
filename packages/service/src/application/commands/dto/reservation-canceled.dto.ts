import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PaymentStatusType, ReservationStatusType } from '@domain';

export class ReservationCanceledDto {
  @ApiProperty({ example: '5001', description: '취소된 예매 ID' })
  readonly reservationId: string;

  @ApiProperty({ example: '7001', description: '예매와 연결된 결제 ID' })
  readonly paymentId: string;

  @ApiProperty({ example: 'CANCELED', description: '예매 상태' })
  readonly reservationStatus: ReservationStatusType;

  @ApiProperty({
    example: 'REFUND_REQUIRED',
    description: '결제 상태. 취소 후 환불 요청 상태로 전환됩니다.',
  })
  readonly paymentStatus: PaymentStatusType;

  @ApiPropertyOptional({ example: 'user request', description: '취소 사유' })
  readonly reason?: string;

  private constructor(params: {
    reservationId: string;
    paymentId: string;
    reservationStatus: ReservationStatusType;
    paymentStatus: PaymentStatusType;
    reason?: string;
  }) {
    this.reservationId = params.reservationId;
    this.paymentId = params.paymentId;
    this.reservationStatus = params.reservationStatus;
    this.paymentStatus = params.paymentStatus;
    this.reason = params.reason;
  }

  static of(params: {
    reservationId: string;
    paymentId: string;
    reservationStatus: ReservationStatusType;
    paymentStatus: PaymentStatusType;
    reason?: string;
  }): ReservationCanceledDto {
    return new ReservationCanceledDto(params);
  }
}
