import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { PaymentProvider, type PaymentProviderType } from '@domain';

export class RequestPaymentRequestDto {
  @ApiProperty({ example: ['9001', '9002'], description: '결제를 요청할 좌석 임시점유 ID 목록' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/^[1-9][0-9]*$/, { each: true })
  readonly seatHoldIds!: string[];

  @ApiProperty({
    example: 'pay-20260429-0001',
    minLength: 8,
    maxLength: 100,
    description: '중복 결제 요청 방지를 위한 회원별 멱등성 키',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9._:-]+$/)
  readonly idempotencyKey!: string;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.LOCAL, description: '결제 provider' })
  @IsIn(Object.values(PaymentProvider))
  readonly provider!: PaymentProviderType;

  @ApiProperty({ example: 15000, minimum: 1, description: '결제 요청 금액' })
  @IsInt()
  @Min(1)
  readonly amount!: number;

  private constructor(params?: {
    seatHoldIds: string[];
    idempotencyKey: string;
    provider: PaymentProviderType;
    amount: number;
  }) {
    if (params !== undefined) {
      this.seatHoldIds = params.seatHoldIds;
      this.idempotencyKey = params.idempotencyKey;
      this.provider = params.provider;
      this.amount = params.amount;
    }
  }

  static of(params: {
    seatHoldIds: string[];
    idempotencyKey: string;
    provider: PaymentProviderType;
    amount: number;
  }): RequestPaymentRequestDto {
    return new RequestPaymentRequestDto(params);
  }
}
