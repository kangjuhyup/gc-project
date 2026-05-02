import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('API rate limit e2e', () => {
  let e2e: ServiceE2eContext;

  beforeAll(async () => {
    e2e = await ServiceE2eContext.create({
      rateLimitLimit: '2',
      rateLimitTtlMilliseconds: '60000',
    });
  });

  beforeEach(async () => {
    await e2e.reset();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it('설정된 요청 횟수를 초과하면 429 Too Many Requests로 거부한다', async () => {
    const first = await e2e.get('/');
    const second = await e2e.get('/');
    const third = await e2e.get('/');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
  });
});
