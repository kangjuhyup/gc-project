import { Module } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import {
  type ClockPort,
  CLOCK,
  type OutboxEventRepositoryPort,
  OUTBOX_EVENT_REPOSITORY,
  type PaymentEventLogRepositoryPort,
  PAYMENT_EVENT_LOG_REPOSITORY,
  type PaymentGatewayPort,
  PAYMENT_GATEWAY,
  type PaymentRepositoryPort,
  PAYMENT_REPOSITORY,
  type TransactionManagerPort,
  TRANSACTION_MANAGER,
} from '@application/commands/ports';
import { CryptoModule } from '../crypto';
import { ENV_KEY } from '../config';
import { PaymentModule } from '../payment';
import { PersistenceModule } from '../persistence';
import { PaymentOutboxWorker } from './payment-outbox-worker';

@Module({
  imports: [PersistenceModule, CryptoModule, PaymentModule],
  providers: [
    {
      provide: PaymentOutboxWorker,
      useFactory: (
        outboxEventRepository: OutboxEventRepositoryPort,
        paymentRepository: PaymentRepositoryPort,
        paymentEventLogRepository: PaymentEventLogRepositoryPort,
        paymentGateway: PaymentGatewayPort,
        transactionManager: TransactionManagerPort,
        clock: ClockPort,
        orm: MikroORM,
        configService: ConfigService,
      ) =>
        new PaymentOutboxWorker(
          outboxEventRepository,
          paymentRepository,
          paymentEventLogRepository,
          paymentGateway,
          transactionManager,
          clock,
          orm,
          {
            enabled: configService.getOrThrow<boolean>(ENV_KEY.PAYMENT_OUTBOX_WORKER_ENABLED),
            intervalMilliseconds: configService.getOrThrow<number>(
              ENV_KEY.PAYMENT_OUTBOX_WORKER_INTERVAL_MS,
            ),
          },
        ),
      inject: [
        OUTBOX_EVENT_REPOSITORY,
        PAYMENT_REPOSITORY,
        PAYMENT_EVENT_LOG_REPOSITORY,
        PAYMENT_GATEWAY,
        TRANSACTION_MANAGER,
        CLOCK,
        MikroORM,
        ConfigService,
      ],
    },
  ],
  exports: [PaymentOutboxWorker],
})
export class OutboxWorkerModule {}
