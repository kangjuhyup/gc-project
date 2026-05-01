import { Logging } from '@kangjuhyup/rvlog';
import type { AdminMemberListResultDto, ListAdminMembersQuery } from '../dto';
import type { MemberQueryPort } from '../ports';

@Logging
export class ListAdminMembersQueryHandler {
  constructor(private readonly memberQuery: MemberQueryPort) {}

  execute(query: ListAdminMembersQuery): Promise<AdminMemberListResultDto> {
    return this.memberQuery.listAdminMembers(query);
  }
}
