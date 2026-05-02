import { ConfigService } from '@nestjs/config';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ENV_KEY } from './service-config';

export function buildThrottlerOptions(
  configService: ConfigService,
): ThrottlerModuleOptions {
  return [
    {
      ttl: configService.getOrThrow<number>(ENV_KEY.RATE_LIMIT_TTL_MILLISECONDS),
      limit: configService.getOrThrow<number>(ENV_KEY.RATE_LIMIT_LIMIT),
    },
  ];
}
