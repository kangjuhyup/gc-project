import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

async function loginAdmin(e2e: ServiceE2eContext): Promise<string> {
  const login = await e2e.post('/admin/login', {
    userId: 'admin',
    password: 'admin-password123!',
  });
  expect(login.status).toBe(201);
  return String(login.body.accessToken);
}

describe('관리자 회원 관리 e2e', () => {
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

  it('관리자는 회원 목록을 상태와 검색어로 조회할 수 있다', async () => {
    const member = await e2e.signupAndLogin('admin_member');
    const accessToken = await loginAdmin(e2e);

    const list = await e2e.get(
      `/admin/members?keyword=${member.userId}&status=ACTIVE&limit=5`,
      { Authorization: `Bearer ${accessToken}` },
    );

    expect(list.status).toBe(200);
    expect(list.body.hasNext).toBe(false);
    expect(list.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: member.memberId,
          userId: member.userId,
          status: 'ACTIVE',
          failedLoginCount: 0,
          createdAt: expect.any(String),
        }),
      ]),
    );
  });

  it('관리자 access token이 없으면 회원 목록을 조회할 수 없다', async () => {
    const list = await e2e.get('/admin/members');

    expect(list.status).toBe(401);
    expect(list.body.message).toBe('AUTHORIZATION_REQUIRED');
  });
});
