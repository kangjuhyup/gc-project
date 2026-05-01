import { describe, expect, it, vi } from 'vitest';
import { AdminMemberListResultDto, ListAdminMembersQuery } from '@application/query/dto';
import { ListAdminMembersQueryHandler } from '@application/query/handlers';
import type { MemberQueryPort } from '@application/query/ports';

describe('ListAdminMembersQueryHandler', () => {
  it('관리자 회원 목록 조회를 member query port에 위임한다', async () => {
    const resultDto = AdminMemberListResultDto.of({
      items: [],
      hasNext: false,
    });
    const memberQuery = {
      existsByUserId: vi.fn(),
      listAdminMembers: vi.fn().mockResolvedValue(resultDto),
    } satisfies MemberQueryPort;
    const handler = new ListAdminMembersQueryHandler(memberQuery);
    const query = ListAdminMembersQuery.of({
      limit: 10,
      keyword: 'member',
      status: 'ACTIVE',
      cursor: 'next-cursor',
    });

    const result = await handler.execute(query);

    expect(memberQuery.listAdminMembers).toHaveBeenCalledWith(query);
    expect(result).toBe(resultDto);
  });
});
