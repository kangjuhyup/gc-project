import { Module } from '@nestjs/common';
import { SEAT_HOLD_CACHE, SEAT_HOLD_LOCK } from '@application/commands/ports';
import { RedisAccessTokenRepository } from './redis-access-token.repository';
import { RedisSeatHoldCache } from './redis-seat-hold-cache';
import { RedisSeatHoldLock } from './redis-seat-hold-lock';
import { RedisModule } from './redis.module';

@Module({
  imports: [RedisModule],
  providers: [
    RedisSeatHoldCache,
    RedisSeatHoldLock,
    RedisAccessTokenRepository,
    {
      provide: SEAT_HOLD_CACHE,
      useExisting: RedisSeatHoldCache,
    },
    {
      provide: SEAT_HOLD_LOCK,
      useExisting: RedisSeatHoldLock,
    },
  ],
  exports: [
    RedisModule,
    RedisAccessTokenRepository,
    SEAT_HOLD_CACHE,
    SEAT_HOLD_LOCK,
  ],
})
export class CacheModule {}
