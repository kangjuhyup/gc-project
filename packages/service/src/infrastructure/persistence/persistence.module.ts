import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import {
  MEMBER_QUERY,
  MOVIE_QUERY,
  PAYMENT_QUERY,
  SEAT_QUERY,
  THEATER_QUERY,
} from '@application/query/ports';
import {
  MEMBER_REPOSITORY,
  OUTBOX_EVENT_REPOSITORY,
  PAYMENT_EVENT_LOG_REPOSITORY,
  PAYMENT_REPOSITORY,
  PHONE_VERIFICATION_REPOSITORY,
  SEAT_HOLD_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@application/commands/ports';
import { persistenceEntities } from './entities';
import {
  MikroOrmMemberRepository,
  MikroOrmMovieQueryRepository,
  MikroOrmOutboxEventRepository,
  MikroOrmPaymentEventLogRepository,
  MikroOrmPaymentRepository,
  MikroOrmPhoneVerificationRepository,
  MikroOrmSeatHoldRepository,
  MikroOrmSeatQueryRepository,
  MikroOrmTheaterQueryRepository,
  MikroOrmTransactionManager,
} from './repositories';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      entities: persistenceEntities,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      dbName: process.env.DB_NAME ?? 'gc_project',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      debug: process.env.NODE_ENV !== 'production',
    }),
  ],
  providers: [
    MikroOrmMemberRepository,
    MikroOrmMovieQueryRepository,
    MikroOrmOutboxEventRepository,
    MikroOrmPaymentEventLogRepository,
    MikroOrmPaymentRepository,
    MikroOrmPhoneVerificationRepository,
    MikroOrmSeatHoldRepository,
    MikroOrmSeatQueryRepository,
    MikroOrmTheaterQueryRepository,
    MikroOrmTransactionManager,
    {
      provide: MEMBER_REPOSITORY,
      useExisting: MikroOrmMemberRepository,
    },
    {
      provide: MEMBER_QUERY,
      useExisting: MikroOrmMemberRepository,
    },
    {
      provide: MOVIE_QUERY,
      useExisting: MikroOrmMovieQueryRepository,
    },
    {
      provide: PAYMENT_QUERY,
      useExisting: MikroOrmPaymentRepository,
    },
    {
      provide: THEATER_QUERY,
      useExisting: MikroOrmTheaterQueryRepository,
    },
    {
      provide: SEAT_QUERY,
      useExisting: MikroOrmSeatQueryRepository,
    },
    {
      provide: PHONE_VERIFICATION_REPOSITORY,
      useExisting: MikroOrmPhoneVerificationRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useExisting: MikroOrmPaymentRepository,
    },
    {
      provide: PAYMENT_EVENT_LOG_REPOSITORY,
      useExisting: MikroOrmPaymentEventLogRepository,
    },
    {
      provide: OUTBOX_EVENT_REPOSITORY,
      useExisting: MikroOrmOutboxEventRepository,
    },
    {
      provide: SEAT_HOLD_REPOSITORY,
      useExisting: MikroOrmSeatHoldRepository,
    },
    {
      provide: TRANSACTION_MANAGER,
      useExisting: MikroOrmTransactionManager,
    },
  ],
  exports: [
    MikroOrmModule,
    MEMBER_REPOSITORY,
    MEMBER_QUERY,
    MOVIE_QUERY,
    PAYMENT_QUERY,
    THEATER_QUERY,
    SEAT_QUERY,
    PHONE_VERIFICATION_REPOSITORY,
    PAYMENT_REPOSITORY,
    PAYMENT_EVENT_LOG_REPOSITORY,
    OUTBOX_EVENT_REPOSITORY,
    SEAT_HOLD_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class PersistenceModule {}
