import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

type HelmetOptions = NonNullable<Parameters<typeof helmet>[0]>;

export function buildHelmetOptions(): HelmetOptions {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
  };
}

export function applySecurityHeaders(app: INestApplication): void {
  app.use(helmet(buildHelmetOptions()));
}
