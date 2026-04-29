import { Logging } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import type {
  PaymentGatewayPort,
  PaymentGatewayRequestResultDto,
  PaymentGatewayRefundResultDto,
  PaymentRefundRequestDto,
} from '@application/commands/ports';

@Injectable()
@Logging
export class LocalPaymentGateway implements PaymentGatewayPort {
  async request(params: {
    paymentId: string;
    amount: number;
  }): Promise<PaymentGatewayRequestResultDto> {
    const providerPaymentId = this.providerPaymentId(params.paymentId);
    const callbackToken = this.callbackToken(params.paymentId, providerPaymentId);
    const callbackDelayMilliseconds = this.randomCallbackDelayMilliseconds();
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

  private providerPaymentId(paymentId: string): string {
    return `local-payment-${paymentId}`;
  }

  private callbackToken(paymentId: string, providerPaymentId: string): string {
    return `local:${paymentId}:${providerPaymentId}`;
  }

  private randomCallbackDelayMilliseconds(): number {
    return 500 + Math.floor(Math.random() * 2_500);
  }

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

  private callbackUrl(): string {
    return process.env.LOCAL_PAYMENT_CALLBACK_URL ?? `http://localhost:${process.env.PORT ?? '3000'}/payments/callback`;
  }
}
