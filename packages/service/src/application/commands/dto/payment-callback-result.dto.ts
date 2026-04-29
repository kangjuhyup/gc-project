import { ApiProperty } from '@nestjs/swagger';

export class PaymentCallbackResultDto {
  @ApiProperty({ example: '7001', description: '처리한 결제 ID' })
  readonly paymentId: string;

  @ApiProperty({ example: true, description: 'callback 처리 성공 여부' })
  readonly handled: boolean;

  private constructor(paymentId: string, handled: boolean) {
    this.paymentId = paymentId;
    this.handled = handled;
  }

  static of(params: { paymentId: string; handled: boolean }): PaymentCallbackResultDto {
    return new PaymentCallbackResultDto(params.paymentId, params.handled);
  }
}
