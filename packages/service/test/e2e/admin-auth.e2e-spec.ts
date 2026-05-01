import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('관리자 인증 e2e', () => {
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

  it('관리자 로그인 후 발급된 access token으로 관리자 인증 확인 API를 호출할 수 있다', async () => {
    const login = await e2e.post('/admin/login', {
      userId: 'admin',
      password: 'admin-password123!',
    });
    expect(login.status).toBe(201);
    expect(login.body).toMatchObject({
      adminId: 'admin',
      accessToken: expect.any(String),
      accessTokenExpiresAt: expect.any(String),
    });

    const me = await e2e.get('/admin/me', {
      Authorization: `Bearer ${String(login.body.accessToken)}`,
    });

    expect(me.status).toBe(200);
    expect(me.body).toEqual({ adminId: 'admin' });
  });

  it('관리자 로그인 계정 정보가 틀리면 access token을 발급하지 않는다', async () => {
    const login = await e2e.post('/admin/login', {
      userId: 'admin',
      password: 'wrong-password',
    });

    expect(login.status).toBe(401);
    expect(login.body.message).toBe('INVALID_ADMIN_CREDENTIALS');
  });

  it('관리자 access token이 없으면 관리자 인증 확인 API를 사용할 수 없다', async () => {
    const me = await e2e.get('/admin/me');

    expect(me.status).toBe(401);
    expect(me.body.message).toBe('AUTHORIZATION_REQUIRED');
  });
});
