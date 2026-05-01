import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import type {
  PaymentGatewayPort,
  PaymentGatewayRequestResultDto,
  PaymentGatewayRefundResultDto,
  PaymentRefundRequestDto,
} from '@application/commands/ports';

export interface LocalPaymentGatewayOptions {
  readonly callbackUrl: string;
  readonly callbackDelayMilliseconds: number;
}

@Injectable()
@Logging
export class LocalPaymentGateway implements PaymentGatewayPort {
  constructor(
    private readonly options: LocalPaymentGatewayOptions,
  ) {}

  async request(params: {
    paymentId: string;
    amount: number;
  }): Promise<PaymentGatewayRequestResultDto> {
    const providerPaymentId = this.providerPaymentId(params.paymentId);
    const callbackToken = this.callbackToken(params.paymentId, providerPaymentId);
    const callbackDelayMilliseconds = this.callbackDelayMilliseconds();
    this.scheduleCallback({
      paymentId: params.paymentId,
      providerPaymentId,
      amount: params.amount,
      token: callbackToken,
      delayMilliseconds: callbackDelayMilliseconds,
    });

    return {
      provider: 'LOCAL',
      providerPaymentId,
      approvalUrl: `/payments/local/callback?paymentId=${params.paymentId}&providerPaymentId=${providerPaymentId}&amount=${params.amount}&approved=true&token=${callbackToken}`,
      expiresAt: new Date(Date.now() + callbackDelayMilliseconds),
    };
  }

  async refund(params: PaymentRefundRequestDto): Promise<PaymentGatewayRefundResultDto> {
    if (params.provider !== 'LOCAL') {
      return { refunded: false, reason: 'LOCAL_PAYMENT_PROVIDER_MISMATCH' };
    }

    return { refunded: true };
  }

  @NoLog
  private providerPaymentId(paymentId: string): string {
    return `local-payment-${paymentId}`;
  }

  @NoLog
  private callbackToken(paymentId: string, providerPaymentId: string): string {
    return `local:${paymentId}:${providerPaymentId}`;
  }

  @NoLog
  private callbackDelayMilliseconds(): number {
    return this.options.callbackDelayMilliseconds;
  }

  @NoLog
  private scheduleCallback(params: {
    paymentId: string;
    providerPaymentId: string;
    amount: number;
    token: string;
    delayMilliseconds: number;
  }): void {
    setTimeout(() => {
      void fetch(this.callbackUrl(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'LOCAL',
          providerPaymentId: params.providerPaymentId,
          paymentId: params.paymentId,
          amount: params.amount,
          approved: true,
          token: params.token,
        }),
      });
    }, params.delayMilliseconds).unref();
  }

  @NoLog
  private callbackUrl(): string {
    return this.options.callbackUrl;
  }
}
