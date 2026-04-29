import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('회원탈퇴 e2e', () => {
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

  it('인증된 회원이 탈퇴하면 상태가 WITHDRAWN으로 변경되고 이후 로그인과 인증 API 사용이 거부된다', async () => {
    const member = await e2e.signupAndLogin('withdraw');

    const withdrawal = await e2e.delete('/members/me', e2e.auth(member));
    expect(withdrawal.status).toBe(200);
    expect(withdrawal.body).toEqual({
      memberId: member.memberId,
      userId: member.userId,
      withdrawn: true,
    });

    expect(await e2e.countRows('member', "id = ? AND status = 'WITHDRAWN'", [member.memberId])).toBe(1);
    expect(await e2e.countRows('member_refresh_token', 'member_id = ? AND revoked_at IS NOT NULL', [member.memberId])).toBe(1);

    const login = await e2e.post('/members/login', {
      userId: member.userId,
      password: 'password123!',
    });
    expect(login.status).toBe(403);

    const secondWithdrawal = await e2e.delete('/members/me', e2e.auth(member));
    expect(secondWithdrawal.status).toBe(401);
  });
});
