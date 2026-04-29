import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetPaymentRequestDto {
  @ApiProperty({ example: '7001', description: '조회할 결제 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly paymentId!: string;

  private constructor(params: { paymentId: string }) {
    this.paymentId = params.paymentId;
  }

  static of(params: { paymentId: string }): GetPaymentRequestDto {
    return new GetPaymentRequestDto(params);
  }
}
