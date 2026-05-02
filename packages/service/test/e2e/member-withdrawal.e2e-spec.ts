import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MemberEntity } from '../../src/infrastructure/persistence/entities';
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

  it('탈퇴한 회원의 아이디는 중복 검사에서 사용 가능하고 같은 아이디로 다시 가입할 수 있다', async () => {
    const userId = 'reuse_member';
    const password = 'password123!';
    const newPassword = 'newPassword123!';

    const firstSignup = await signup(e2e, {
      userId,
      password,
      phoneNumber: '01091000001',
    });
    expect(firstSignup.status).toBe(201);
    const storedMember = await e2e.orm.em.fork().findOne(MemberEntity, { id: String(firstSignup.body.memberId) });
    expect(storedMember?.phoneNumber).toMatch(/^aes256-cbc:v1:/);
    expect(storedMember?.phoneNumber).not.toBe('01091000001');

    const firstLogin = await e2e.post('/members/login', { userId, password });
    expect(firstLogin.status).toBe(201);

    const withdrawal = await e2e.delete('/members/me', {
      Authorization: `Bearer ${String(firstLogin.body.accessToken)}`,
    });
    expect(withdrawal.status).toBe(200);

    const availability = await e2e.get(`/members/check-user-id?userId=${userId}`);
    expect(availability.status).toBe(200);
    expect(availability.body).toEqual({ available: true });

    const secondSignup = await signup(e2e, {
      userId,
      password: newPassword,
      phoneNumber: '01091000001',
    });
    expect(secondSignup.status).toBe(201);
    expect(secondSignup.body.userId).toBe(userId);

    const secondLogin = await e2e.post('/members/login', { userId, password: newPassword });
    expect(secondLogin.status).toBe(201);
    expect(secondLogin.body.memberId).toBe(secondSignup.body.memberId);
  });
});

async function signup(
  e2e: ServiceE2eContext,
  params: { userId: string; password: string; phoneNumber: string },
) {
  const phoneVerification = await e2e.post('/phone-verifications', { phoneNumber: params.phoneNumber });
  expect(phoneVerification.status).toBe(201);

  const confirmed = await e2e.post('/phone-verifications/confirm', {
    verificationId: phoneVerification.body.verificationId,
    phoneNumber: params.phoneNumber,
    code: phoneVerification.body.code,
  });
  expect(confirmed.status).toBe(201);

  return e2e.post('/members/signup', {
    userId: params.userId,
    password: params.password,
    name: 'Reuse Member',
    birthDate: '1990-01-01',
    phoneNumber: params.phoneNumber,
    address: '서울특별시 강남구 테헤란로 427',
    phoneVerificationId: phoneVerification.body.verificationId,
  });
}
