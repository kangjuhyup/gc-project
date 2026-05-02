import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('회원 토큰 재발급 e2e', () => {
  let e2e: ServiceE2eContext;

  beforeAll(async () => {
    e2e = await ServiceE2eContext.create();
  });

  beforeEach(async () => {
    await e2e.reset();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it('유효한 refresh token으로 새 access token과 refresh token을 발급하고 기존 refresh token은 재사용할 수 없다', async () => {
    const member = await e2e.signupAndLogin('token_refresh');

    const refresh = await e2e.post('/members/token/refresh', {
      refreshToken: member.refreshToken,
    });

    expect(refresh.status).toBe(201);
    expect(refresh.body).toMatchObject({
      memberId: member.memberId,
      userId: member.userId,
      accessToken: expect.any(String),
      accessTokenExpiresAt: expect.any(String),
      refreshToken: expect.any(String),
      refreshTokenExpiresAt: expect.any(String),
    });
    expect(refresh.body.accessToken).not.toBe(member.accessToken);
    expect(refresh.body.refreshToken).not.toBe(member.refreshToken);
    expect(
      await e2e.countRows('member_refresh_token', 'member_id = ? AND revoked_at IS NOT NULL', [
        member.memberId,
      ]),
    ).toBe(1);

    const oldTokenRefresh = await e2e.post('/members/token/refresh', {
      refreshToken: member.refreshToken,
    });
    expect(oldTokenRefresh.status).toBe(401);
    expect(oldTokenRefresh.body.message).toBe('INVALID_REFRESH_TOKEN');

    const logout = await e2e.post(
      '/members/logout',
      {},
      {
        Authorization: `Bearer ${String(refresh.body.accessToken)}`,
      },
    );
    expect(logout.status).toBe(201);
  });

  it('refresh token이 없으면 토큰을 재발급할 수 없다', async () => {
    const refresh = await e2e.post('/members/token/refresh', {
      refreshToken: 'missing-refresh-token',
    });

    expect(refresh.status).toBe(401);
    expect(refresh.body.message).toBe('INVALID_REFRESH_TOKEN');
  });
});
