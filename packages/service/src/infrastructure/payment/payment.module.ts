import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_CALLBACK_VERIFIER,
  PAYMENT_GATEWAY,
} from '@application/commands/ports';
import { CryptoModule } from '../crypto';
import { ENV_KEY } from '../config';
import { PersistenceModule } from '../persistence';
import { LocalPaymentCallbackVerifier } from './local-payment-callback-verifier';
import { LocalPaymentGateway } from './local-payment-gateway';

@Module({
  imports: [PersistenceModule, CryptoModule],
  providers: [
    LocalPaymentCallbackVerifier,
    {
      provide: LocalPaymentGateway,
      useFactory: (configService: ConfigService): LocalPaymentGateway =>
        new LocalPaymentGateway({
          callbackUrl: configService.getOrThrow<string>(ENV_KEY.LOCAL_PAYMENT_CALLBACK_URL),
          callbackDelayMilliseconds: Math.round(
            configService.getOrThrow<number>(
              ENV_KEY.LOCAL_PAYMENT_CALLBACK_DELAY_SECONDS,
            ) * 1000,
          ),
        }),
      inject: [ConfigService],
    },
    {
      provide: PAYMENT_GATEWAY,
      useExisting: LocalPaymentGateway,
    },
    {
      provide: PAYMENT_CALLBACK_VERIFIER,
      useExisting: LocalPaymentCallbackVerifier,
    },
  ],
  exports: [PAYMENT_GATEWAY, PAYMENT_CALLBACK_VERIFIER],
})
export class PaymentModule {}
