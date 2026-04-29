import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import type { SeatHoldLock, SeatHoldLockPort } from '@application/commands/ports';
import { REDIS } from './redis.module';

@Injectable()
@Logging
export class RedisSeatHoldLock implements SeatHoldLockPort {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async acquire(params: {
    screeningId: string;
    seatIds: string[];
    ttlMilliseconds: number;
  }): Promise<SeatHoldLock | undefined> {
    const token = randomUUID();
    const seatIds = [...params.seatIds].sort();
    const lockedSeatIds: string[] = [];
    const startedAt = Date.now();

    for (const seatId of seatIds) {
      const result = await this.redis.set(
        this.key(params.screeningId, seatId),
        token,
        'PX',
        params.ttlMilliseconds,
        'NX',
      );

      if (result !== 'OK') {
        await this.release({ screeningId: params.screeningId, seatIds: lockedSeatIds, token });
        return undefined;
      }

      lockedSeatIds.push(seatId);
    }

    if (Date.now() - startedAt >= params.ttlMilliseconds) {
      await this.release({ screeningId: params.screeningId, seatIds: lockedSeatIds, token });
      return undefined;
    }

    return {
      screeningId: params.screeningId,
      seatIds,
      token,
    };
  }

  @NoLog
  async release(lock: SeatHoldLock): Promise<void> {
    await Promise.all(
      lock.seatIds.map((seatId) =>
        this.redis.eval(
          `
            if redis.call("GET", KEYS[1]) == ARGV[1] then
              return redis.call("DEL", KEYS[1])
            end
            return 0
          `,
          1,
          this.key(lock.screeningId, seatId),
          lock.token,
        ),
      ),
    );
  }

  private key(screeningId: string, seatId: string): string {
    return `seat-hold-lock:${screeningId}:${seatId}`;
  }
}
