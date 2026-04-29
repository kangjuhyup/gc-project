import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS,
      useFactory: (configService: ConfigService): Redis =>
        new Redis(configService.get<string>('REDIS_URL') ?? 'redis://:gc_redis_password@localhost:6379'),
      inject: [ConfigService],
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
