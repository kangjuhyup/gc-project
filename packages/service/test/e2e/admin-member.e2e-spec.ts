import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AdminAuditEntity, MemberEntity } from '../../src/infrastructure/persistence/entities';
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
    const storedMember = await e2e.orm.em.fork().findOneOrFail(MemberEntity, { id: member.memberId });

    const list = await e2e.get(
      `/admin/members?keyword=${member.userId}&status=ACTIVE&currentPage=1&countPerPage=5`,
      { Authorization: `Bearer ${accessToken}` },
    );

    expect(list.status).toBe(200);
    expect(list.body.currentPage).toBe(1);
    expect(list.body.countPerPage).toBe(5);
    expect(list.body.totalCount).toBe(1);
    expect(list.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: member.memberId,
          userId: member.userId,
          name: expect.stringContaining('*'),
          phoneNumber: expect.stringMatching(/^010\*{4}\d{4}$/),
          status: 'ACTIVE',
          failedLoginCount: 0,
          createdAt: expect.any(String),
        }),
      ]),
    );
    expect(list.body.privacy).toEqual({
      masked: true,
      fields: ['name', 'phoneNumber'],
    });
    expect(list.body.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: storedMember.name,
          phoneNumber: storedMember.phoneNumber,
        }),
      ]),
    );
  });

  it('관리자는 해제 사유 헤더를 남기면 회원 개인정보 원문을 조회하고 audit을 저장한다', async () => {
    const member = await e2e.signupAndLogin('admin_unmask');
    const accessToken = await loginAdmin(e2e);
    const storedMember = await e2e.orm.em.fork().findOneOrFail(MemberEntity, { id: member.memberId });

    const list = await e2e.get(
      `/admin/members?keyword=${member.userId}&status=ACTIVE&currentPage=1&countPerPage=5`,
      {
        Authorization: `Bearer ${accessToken}`,
        'x-admin-unmask-pii': 'true',
        'x-admin-unmask-reason': encodeURIComponent('고객 문의 응대'),
      },
    );

    expect(list.status).toBe(200);
    expect(list.body.privacy).toEqual({
      masked: false,
      fields: ['name', 'phoneNumber'],
    });
    expect(list.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: member.memberId,
          name: storedMember.name,
          phoneNumber: storedMember.phoneNumber,
        }),
      ]),
    );

    const audits = await e2e.orm.em.fork().find(AdminAuditEntity, {});
    expect(audits).toEqual([
      expect.objectContaining({
        adminId: 'admin',
        httpMethod: 'GET',
        path: '/admin/members',
        unmaskedFields: ['name', 'phoneNumber'],
        targetType: 'MEMBER',
        targetIds: [member.memberId],
        reason: '고객 문의 응대',
      }),
    ]);
  });

  it('관리자는 해제 사유 없이 개인정보 마스킹을 해제할 수 없다', async () => {
    const accessToken = await loginAdmin(e2e);

    const list = await e2e.get('/admin/members?currentPage=1&countPerPage=5', {
      Authorization: `Bearer ${accessToken}`,
      'x-admin-unmask-pii': 'true',
    });

    expect(list.status).toBe(400);
    expect(list.body.message).toBe('ADMIN_UNMASK_REASON_REQUIRED');
  });

  it('관리자 access token이 없으면 회원 목록을 조회할 수 없다', async () => {
    const list = await e2e.get('/admin/members');

    expect(list.status).toBe(401);
    expect(list.body.message).toBe('AUTHORIZATION_REQUIRED');
  });
});
