import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEV_ALLOWED_ORIGIN = 'http://localhost:5173';

export function buildCorsOptions(nodeEnv = process.env.NODE_ENV): CorsOptions | undefined {
  if (nodeEnv !== 'development') {
    return undefined;
  }

  return {
    origin: DEV_ALLOWED_ORIGIN,
  };
}
