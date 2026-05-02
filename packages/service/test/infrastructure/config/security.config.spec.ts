import { describe, expect, it, vi } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { applySecurityHeaders, buildHelmetOptions } from '@infrastructure/config';

describe('helmet 보안 헤더 설정', () => {
  it('Swagger UI를 유지하면서 기본 보안 헤더 정책을 구성한다', () => {
    const options = buildHelmetOptions();
    const contentSecurityPolicy = options.contentSecurityPolicy;

    expect(contentSecurityPolicy).toBeTypeOf('object');

    if (typeof contentSecurityPolicy !== 'object') {
      throw new Error('CONTENT_SECURITY_POLICY_NOT_CONFIGURED');
    }

    const directives = contentSecurityPolicy.directives;

    expect(directives).toMatchObject({
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    });
    expect(directives?.scriptSrc).toContain("'unsafe-inline'");
    expect(directives?.styleSrc).toContain("'unsafe-inline'");
    expect(directives?.imgSrc).toContain('data:');
  });

  it('API 애플리케이션에 helmet middleware를 등록한다', () => {
    const app = {
      use: vi.fn(),
    } as unknown as INestApplication;

    applySecurityHeaders(app);

    expect(app.use).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledWith(expect.any(Function));
  });
});
