import { Logging } from '@kangjuhyup/rvlog';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { SeatHoldModel } from '@domain';
import type { SeatHoldCachePort } from '@application/commands/ports';
import { REDIS } from './redis.module';

@Injectable()
@Logging
export class RedisSeatHoldCache implements SeatHoldCachePort {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async hold(model: SeatHoldModel, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(
      this.key(model.screeningId, model.seatId),
      JSON.stringify({
        screeningId: model.screeningId,
        seatId: model.seatId,
        memberId: model.memberId,
        expiresAt: model.expiresAt.toISOString(),
      }),
      'EX',
      ttlSeconds,
      'NX',
    );

    return result === 'OK';
  }

  async release(screeningId: string, seatId: string): Promise<void> {
    await this.redis.del(this.key(screeningId, seatId));
  }

  private key(screeningId: string, seatId: string): string {
    return `seat-hold:${screeningId}:${seatId}`;
  }
}
