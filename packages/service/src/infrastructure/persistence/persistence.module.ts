import { Module } from '@nestjs/common';
import { DefaultLogger, type Logger, type LoggerNamespace, type LogContext } from '@mikro-orm/core';
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
  ADMIN_AUDIT_REPOSITORY,
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
import { EntityEncryptionService } from './encryption';
import {
  MikroOrmAdminAuditRepository,
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
import { Migration202604300002SeedData } from './migrations/Migration202604300002SeedData';
import { ENV_KEY } from '../config';
import { CryptoModule } from '../crypto';

class ThresholdMikroOrmLogger implements Logger {
  constructor(private readonly threshold: 'WARN' | 'ERROR') {}

  log(): void {}

  warn(namespace: LoggerNamespace | string, message: string, _context?: LogContext): void {
    if (this.threshold === 'WARN') {
      console.warn(`[${namespace}] ${message}`);
    }
  }

  logQuery(): void {}

  setDebugMode(): void {}

  isEnabled(): boolean {
    return false;
  }

  error(namespace: LoggerNamespace | string, message: string, _context?: LogContext): void {
    console.error(`[${namespace}] ${message}`);
  }
}

@Module({
  imports: [
    CryptoModule,
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.getOrThrow<string>(ENV_KEY.NODE_ENV);
        const logLevel = configService.getOrThrow<string>(ENV_KEY.LOG_LEVEL);

        return {
          driver: PostgreSqlDriver,
          entities: persistenceEntities,
          extensions: [Migrator],
          host: configService.getOrThrow<string>(ENV_KEY.DB_HOST),
          port: configService.getOrThrow<number>(ENV_KEY.DB_PORT),
          dbName: configService.getOrThrow<string>(ENV_KEY.DB_NAME),
          user: configService.getOrThrow<string>(ENV_KEY.DB_USER),
          password: configService.getOrThrow<string>(ENV_KEY.DB_PASSWORD),
          debug: !['production', 'test'].includes(nodeEnv),
          loggerFactory: ['WARN', 'ERROR'].includes(logLevel)
            ? () => new ThresholdMikroOrmLogger(logLevel as 'WARN' | 'ERROR')
            : DefaultLogger.create,
          migrations: {
            migrationsList: [
              {
                name: 'Migration202604300001CreateTables',
                class: Migration202604300001CreateTables,
              },
              { name: 'Migration202604300002SeedData', class: Migration202604300002SeedData },
            ],
          },
        };
      },
    }),
  ],
  providers: [
    EntityEncryptionService,
    MikroOrmAdminAuditRepository,
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
      provide: ADMIN_AUDIT_REPOSITORY,
      useExisting: MikroOrmAdminAuditRepository,
    },
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
    ADMIN_AUDIT_REPOSITORY,
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
