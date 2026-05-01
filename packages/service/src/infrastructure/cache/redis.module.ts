import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ENV_KEY } from '@infrastructure/config';

export const REDIS = Symbol('REDIS');

@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (configService: ConfigService): Redis =>
        new Redis(configService.getOrThrow<string>(ENV_KEY.REDIS_URL)),
      inject: [ConfigService],
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
