import { Module } from '@nestjs/common';
import {
  CLOCK,
  OUTBOX_EVENT_REPOSITORY,
  PAYMENT_CALLBACK_VERIFIER,
  PAYMENT_EVENT_LOG_REPOSITORY,
  PAYMENT_GATEWAY,
  PAYMENT_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@application/commands/ports';
import { CryptoModule } from '../crypto';
import { PersistenceModule } from '../persistence';
import { LocalPaymentCallbackVerifier } from './local-payment-callback-verifier';
import { LocalPaymentGateway } from './local-payment-gateway';
import { PaymentOutboxWorker } from './payment-outbox-worker';

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
    {
      provide: PaymentOutboxWorker,
      useFactory: (
        outboxEventRepository,
        paymentRepository,
        paymentEventLogRepository,
        paymentGateway,
        transactionManager,
        clock,
      ) =>
        new PaymentOutboxWorker(
          outboxEventRepository,
          paymentRepository,
          paymentEventLogRepository,
          paymentGateway,
          transactionManager,
          clock,
        ),
      inject: [
        OUTBOX_EVENT_REPOSITORY,
        PAYMENT_REPOSITORY,
        PAYMENT_EVENT_LOG_REPOSITORY,
        PAYMENT_GATEWAY,
        TRANSACTION_MANAGER,
        CLOCK,
      ],
    },
  ],
  exports: [PAYMENT_GATEWAY, PAYMENT_CALLBACK_VERIFIER, PaymentOutboxWorker],
})
export class PaymentModule {}
