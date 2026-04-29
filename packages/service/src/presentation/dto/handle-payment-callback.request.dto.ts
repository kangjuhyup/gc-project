import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { PaymentProvider, type PaymentProviderType } from '@domain';

export class HandlePaymentCallbackRequestDto {
  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.LOCAL, description: 'callback을 보낸 결제 provider' })
  @IsIn(Object.values(PaymentProvider))
  readonly provider!: PaymentProviderType;

  @ApiProperty({ example: 'local-payment-7001', description: 'provider 결제 ID' })
  @IsString()
  readonly providerPaymentId!: string;

  @ApiProperty({ example: '7001', description: '서비스 결제 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly paymentId!: string;

  @ApiProperty({ example: 15000, minimum: 1, description: 'provider 승인 금액' })
  @IsInt()
  @Min(1)
  readonly amount!: number;

  @ApiProperty({ example: true, description: 'provider 승인 성공 여부' })
  @IsBoolean()
  readonly approved!: boolean;

  @ApiPropertyOptional({ example: 'INSUFFICIENT_BALANCE', description: 'provider 실패 사유' })
  @IsOptional()
  @IsString()
  readonly failureReason?: string;

  @ApiPropertyOptional({ example: 'local:7001:local-payment-7001', description: 'callback 검증 token' })
  @IsOptional()
  @IsString()
  readonly token?: string;

  private constructor(params?: {
    provider: PaymentProviderType;
    providerPaymentId: string;
    paymentId: string;
    amount: number;
    approved: boolean;
    failureReason?: string;
    token?: string;
  }) {
    if (params !== undefined) {
      this.provider = params.provider;
      this.providerPaymentId = params.providerPaymentId;
      this.paymentId = params.paymentId;
      this.amount = params.amount;
      this.approved = params.approved;
      this.failureReason = params.failureReason;
      this.token = params.token;
    }
  }

  static of(params: {
    provider: PaymentProviderType;
    providerPaymentId: string;
    paymentId: string;
    amount: number;
    approved: boolean;
    failureReason?: string;
    token?: string;
  }): HandlePaymentCallbackRequestDto {
    return new HandlePaymentCallbackRequestDto(params);
  }
}
