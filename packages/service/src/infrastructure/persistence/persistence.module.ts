import { Module } from '@nestjs/common';
import { Migrator } from '@mikro-orm/migrations';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import {
  MEMBER_QUERY,
  MOVIE_QUERY,
  PAYMENT_QUERY,
  RESERVATION_QUERY,
  SEAT_QUERY,
  THEATER_QUERY,
} from '@application/query/ports';
import {
  MEMBER_REPOSITORY,
  MOVIE_REPOSITORY,
  OUTBOX_EVENT_REPOSITORY,
  PAYMENT_EVENT_LOG_REPOSITORY,
  PAYMENT_REPOSITORY,
  PHONE_VERIFICATION_REPOSITORY,
  RESERVATION_EVENT_REPOSITORY,
  RESERVATION_REPOSITORY,
  RESERVATION_SEAT_REPOSITORY,
  SEAT_HOLD_REPOSITORY,
  TRANSACTION_MANAGER,
} from '@application/commands/ports';
import { persistenceEntities } from './entities';
import {
  MikroOrmMemberRepository,
  MikroOrmMovieRepository,
  MikroOrmMovieQueryRepository,
  MikroOrmOutboxEventRepository,
  MikroOrmPaymentEventLogRepository,
  MikroOrmPaymentRepository,
  MikroOrmPhoneVerificationRepository,
  MikroOrmRefreshTokenRepository,
  MikroOrmReservationEventRepository,
  MikroOrmReservationQueryRepository,
  MikroOrmReservationRepository,
  MikroOrmReservationSeatRepository,
  MikroOrmSeatHoldRepository,
  MikroOrmSeatQueryRepository,
  MikroOrmTheaterQueryRepository,
  MikroOrmTransactionManager,
} from './repositories';
import { Migration202604300001CreateTables } from './migrations/Migration202604300001CreateTables';
import { Migration202604300002SeedTempMovieData } from './migrations/Migration202604300002SeedTempMovieData';
import { ENV_KEY } from '../config';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        driver: PostgreSqlDriver,
        entities: persistenceEntities,
        extensions: [Migrator],
        host: configService.getOrThrow<string>(ENV_KEY.DB_HOST),
        port: configService.getOrThrow<number>(ENV_KEY.DB_PORT),
        dbName: configService.getOrThrow<string>(ENV_KEY.DB_NAME),
        user: configService.getOrThrow<string>(ENV_KEY.DB_USER),
        password: configService.getOrThrow<string>(ENV_KEY.DB_PASSWORD),
        debug: configService.getOrThrow<string>(ENV_KEY.NODE_ENV) !== 'production',
        migrations: {
          migrationsList: [
            { name: 'Migration202604300001CreateTables', class: Migration202604300001CreateTables },
            { name: 'Migration202604300002SeedTempMovieData', class: Migration202604300002SeedTempMovieData },
          ],
        },
      }),
    }),
  ],
  providers: [
    MikroOrmMemberRepository,
    MikroOrmMovieRepository,
    MikroOrmMovieQueryRepository,
    MikroOrmOutboxEventRepository,
    MikroOrmPaymentEventLogRepository,
    MikroOrmPaymentRepository,
    MikroOrmPhoneVerificationRepository,
    MikroOrmRefreshTokenRepository,
    MikroOrmReservationEventRepository,
    MikroOrmReservationQueryRepository,
    MikroOrmReservationRepository,
    MikroOrmReservationSeatRepository,
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
      provide: MOVIE_REPOSITORY,
      useExisting: MikroOrmMovieRepository,
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
      provide: RESERVATION_QUERY,
      useExisting: MikroOrmReservationQueryRepository,
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
      provide: RESERVATION_REPOSITORY,
      useExisting: MikroOrmReservationRepository,
    },
    {
      provide: RESERVATION_SEAT_REPOSITORY,
      useExisting: MikroOrmReservationSeatRepository,
    },
    {
      provide: RESERVATION_EVENT_REPOSITORY,
      useExisting: MikroOrmReservationEventRepository,
    },
    {
      provide: TRANSACTION_MANAGER,
      useExisting: MikroOrmTransactionManager,
    },
  ],
  exports: [
    MEMBER_REPOSITORY,
    MOVIE_REPOSITORY,
    MEMBER_QUERY,
    MOVIE_QUERY,
    PAYMENT_QUERY,
    RESERVATION_QUERY,
    THEATER_QUERY,
    SEAT_QUERY,
    PHONE_VERIFICATION_REPOSITORY,
    MikroOrmRefreshTokenRepository,
    PAYMENT_REPOSITORY,
    PAYMENT_EVENT_LOG_REPOSITORY,
    OUTBOX_EVENT_REPOSITORY,
    SEAT_HOLD_REPOSITORY,
    RESERVATION_REPOSITORY,
    RESERVATION_SEAT_REPOSITORY,
    RESERVATION_EVENT_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class PersistenceModule {}
