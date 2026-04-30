import { Module } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import {
  CLOCK,
  OUTBOX_EVENT_REPOSITORY,
  PAYMENT_EVENT_LOG_REPOSITORY,
  PAYMENT_GATEWAY,
  PAYMENT_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@application/commands/ports';
import { CryptoModule } from '../crypto';
import { PaymentModule } from '../payment';
import { PersistenceModule } from '../persistence';
import { PaymentOutboxWorker } from './payment-outbox-worker';

@Module({
  imports: [PersistenceModule, CryptoModule, PaymentModule],
  providers: [
    {
      provide: PaymentOutboxWorker,
      useFactory: (
        outboxEventRepository,
        paymentRepository,
        paymentEventLogRepository,
        paymentGateway,
        transactionManager,
        clock,
        orm,
      ) =>
        new PaymentOutboxWorker(
          outboxEventRepository,
          paymentRepository,
          paymentEventLogRepository,
          paymentGateway,
          transactionManager,
          clock,
          orm,
        ),
      inject: [
        OUTBOX_EVENT_REPOSITORY,
        PAYMENT_REPOSITORY,
        PAYMENT_EVENT_LOG_REPOSITORY,
        PAYMENT_GATEWAY,
        TRANSACTION_MANAGER,
        CLOCK,
        MikroORM,
      ],
    },
  ],
  exports: [PaymentOutboxWorker],
})
export class OutboxWorkerModule {}
