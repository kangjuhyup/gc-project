import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RefundPaymentRequestDto {
  @ApiProperty({ example: '7001', description: '환불할 결제 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly paymentId!: string;

  private constructor(params?: { paymentId: string }) {
    if (params !== undefined) {
      this.paymentId = params.paymentId;
    }
  }

  static of(params: { paymentId: string }): RefundPaymentRequestDto {
    return new RefundPaymentRequestDto(params);
  }
}
