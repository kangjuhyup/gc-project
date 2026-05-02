import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { buildThrottlerOptions, ENV_KEY } from '@infrastructure/config';

describe('buildThrottlerOptions', () => {
  it('config service에서 읽은 rate limit 값을 NestJS throttler 옵션으로 변환한다', () => {
    const configService = new ConfigService({
      [ENV_KEY.RATE_LIMIT_TTL_MILLISECONDS]: 30000,
      [ENV_KEY.RATE_LIMIT_LIMIT]: 50,
    });

    expect(buildThrottlerOptions(configService)).toEqual([
      {
        ttl: 30000,
        limit: 50,
      },
    ]);
  });
});
