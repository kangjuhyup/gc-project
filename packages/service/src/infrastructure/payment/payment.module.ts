import { Module } from '@nestjs/common';
import {
  PAYMENT_CALLBACK_VERIFIER,
  PAYMENT_GATEWAY,
} from '@application/commands/ports';
import { CryptoModule } from '../crypto';
import { PersistenceModule } from '../persistence';
import { LocalPaymentCallbackVerifier } from './local-payment-callback-verifier';
import { LocalPaymentGateway } from './local-payment-gateway';

@Module({
  imports: [PersistenceModule, CryptoModule],
  providers: [
    LocalPaymentGateway,
    LocalPaymentCallbackVerifier,
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
