import { ApiProperty } from '@nestjs/swagger';
import type { PaymentStatusType } from '@domain';

export class PaymentRefundResultDto {
  @ApiProperty({ example: '7001', description: '환불 처리한 결제 ID' })
  readonly paymentId: string;

  @ApiProperty({ example: 'REFUNDED', description: '환불 처리 후 결제 상태' })
  readonly status: PaymentStatusType;

  private constructor(paymentId: string, status: PaymentStatusType) {
    this.paymentId = paymentId;
    this.status = status;
  }

  static of(params: { paymentId: string; status: PaymentStatusType }): PaymentRefundResultDto {
    return new PaymentRefundResultDto(params.paymentId, params.status);
  }
}
