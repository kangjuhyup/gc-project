import { describe, expect, it, vi } from 'vitest';
import { CheckUserIdAvailabilityQuery } from '@application/query/dto';
import { CheckUserIdAvailabilityQueryHandler } from '@application/query/handlers';
import type { MemberQueryPort } from '@application/query/ports';

describe('CheckUserIdAvailabilityQueryHandler', () => {
  it('활성 회원 아이디가 이미 존재하면 사용 불가능으로 응답한다', async () => {
    const memberQuery = {
      existsByUserId: vi.fn().mockResolvedValue(true),
      listAdminMembers: vi.fn(),
    } satisfies MemberQueryPort;
    const handler = new CheckUserIdAvailabilityQueryHandler(memberQuery);

    const result = await handler.execute(CheckUserIdAvailabilityQuery.of({ userId: 'member_01' }));

    expect(result.available).toBe(false);
  });

  it('활성 회원 아이디가 존재하지 않으면 사용 가능으로 응답한다', async () => {
    const memberQuery = {
      existsByUserId: vi.fn().mockResolvedValue(false),
      listAdminMembers: vi.fn(),
    } satisfies MemberQueryPort;
    const handler = new CheckUserIdAvailabilityQueryHandler(memberQuery);

    const result = await handler.execute(CheckUserIdAvailabilityQuery.of({ userId: 'member_01' }));

    expect(result.available).toBe(true);
  });
});
