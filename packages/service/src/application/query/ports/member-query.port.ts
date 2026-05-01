import type { AdminMemberListResultDto, ListAdminMembersQuery } from '../dto';

export const MEMBER_QUERY = Symbol('MEMBER_QUERY');

export interface MemberQueryPort {
  existsByUserId(userId: string): Promise<boolean>;
  listAdminMembers(query: ListAdminMembersQuery): Promise<AdminMemberListResultDto>;
}
