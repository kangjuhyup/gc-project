import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEV_ALLOWED_ORIGIN = 'http://localhost:5173';
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'Accept',
  'Origin',
  'X-Requested-With',
  'X-Correlation-Id',
  'x-correlation-id',
];
const EXPOSED_HEADERS = ['X-Correlation-Id', 'x-correlation-id'];

export function buildCorsOptions(nodeEnv: string | undefined): CorsOptions | undefined {
  if (nodeEnv !== 'development') {
    return undefined;
  }

  return {
    origin: DEV_ALLOWED_ORIGIN,
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    credentials: true,
    maxAge: 600,
    optionsSuccessStatus: 204,
  };
}
