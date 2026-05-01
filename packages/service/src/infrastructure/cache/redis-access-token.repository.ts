import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from './redis.module';

@Injectable()
@Logging
export class RedisAccessTokenRepository {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async save(params: {
    namespace: string;
    subjectId: string;
    accessToken: string;
    ttlSeconds: number;
  }): Promise<void> {
    await this.redis
      .multi()
      .set(this.tokenKey(params.namespace, params.accessToken), params.subjectId, 'EX', params.ttlSeconds)
      .sadd(this.subjectKey(params.namespace, params.subjectId), params.accessToken)
      .expire(this.subjectKey(params.namespace, params.subjectId), params.ttlSeconds)
      .exec();
  }

  async findSubjectId(namespace: string, accessToken: string): Promise<string | undefined> {
    return (await this.redis.get(this.tokenKey(namespace, accessToken))) ?? undefined;
  }

  async revokeBySubjectId(namespace: string, subjectId: string): Promise<number> {
    const subjectKey = this.subjectKey(namespace, subjectId);
    const accessTokens = await this.redis.smembers(subjectKey);

    if (accessTokens.length === 0) {
      await this.redis.del(subjectKey);
      return 0;
    }

    const keys = accessTokens.map((accessToken) => this.tokenKey(namespace, accessToken));
    const revoked = await this.redis.del(...keys);
    await this.redis.del(subjectKey);

    return revoked;
  }

  @NoLog
  private tokenKey(namespace: string, accessToken: string): string {
    return `${namespace}:access-token:${accessToken}`;
  }

  @NoLog
  private subjectKey(namespace: string, subjectId: string): string {
    return `${namespace}:access-tokens:${subjectId}`;
  }
}
