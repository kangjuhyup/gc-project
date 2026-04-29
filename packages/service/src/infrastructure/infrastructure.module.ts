import { Module } from '@nestjs/common';
import { AuthModule } from './auth';
import { CacheModule } from './cache';
import { CryptoModule } from './crypto';
import { LoggingModule } from './logging';
import { PersistenceModule } from './persistence';
import { PublicApiModule } from './public-api';

@Module({
  imports: [
    PersistenceModule,
    CacheModule,
    CryptoModule,
    LoggingModule,
    PublicApiModule,
    AuthModule,
  ],
  exports: [
    PersistenceModule,
    CacheModule,
    CryptoModule,
    LoggingModule,
    PublicApiModule,
    AuthModule,
  ],
})
export class InfrastructureModule {}
