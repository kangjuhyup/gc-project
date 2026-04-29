import { Module } from '@nestjs/common';
import { AuthModule } from './auth';
import { CacheModule } from './cache';
import { CryptoModule } from './crypto';
import { LoggingModule } from './logging';
import { PersistenceModule } from './persistence';
import { PaymentModule } from './payment';
import { PublicApiModule } from './public-api';

@Module({
  imports: [
    PersistenceModule,
    CacheModule,
    CryptoModule,
    LoggingModule,
    PaymentModule,
    PublicApiModule,
    AuthModule,
  ],
  exports: [
    PersistenceModule,
    CacheModule,
    CryptoModule,
    LoggingModule,
    PaymentModule,
    PublicApiModule,
    AuthModule,
  ],
})
export class InfrastructureModule {}
