import { Logging } from '@kangjuhyup/rvlog';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from './redis.module';

@Injectable()
@Logging
export class RedisAccessTokenRepository {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async save(params: { memberId: string; accessToken: string; ttlSeconds: number }): Promise<void> {
    await this.redis
      .multi()
      .set(this.tokenKey(params.accessToken), params.memberId, 'EX', params.ttlSeconds)
      .sadd(this.memberKey(params.memberId), params.accessToken)
      .expire(this.memberKey(params.memberId), params.ttlSeconds)
      .exec();
  }

  async findMemberId(accessToken: string): Promise<string | undefined> {
    return (await this.redis.get(this.tokenKey(accessToken))) ?? undefined;
  }

  async revokeByMemberId(memberId: string): Promise<number> {
    const memberKey = this.memberKey(memberId);
    const accessTokens = await this.redis.smembers(memberKey);

    if (accessTokens.length === 0) {
      await this.redis.del(memberKey);
      return 0;
    }

    const keys = accessTokens.map((accessToken) => this.tokenKey(accessToken));
    const revoked = await this.redis.del(...keys);
    await this.redis.del(memberKey);

    return revoked;
  }

  private tokenKey(accessToken: string): string {
    return `access-token:${accessToken}`;
  }

  private memberKey(memberId: string): string {
    return `member-access-tokens:${memberId}`;
  }
}
