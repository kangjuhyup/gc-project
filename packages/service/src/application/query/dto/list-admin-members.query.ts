import type { MemberStatusType } from '@domain';

export class ListAdminMembersQuery {
  private constructor(
    readonly currentPage: number,
    readonly countPerPage: number,
    readonly keyword?: string,
    readonly status?: MemberStatusType,
  ) {}

  static of(params: {
    currentPage?: number;
    countPerPage?: number;
    keyword?: string;
    status?: MemberStatusType;
  }): ListAdminMembersQuery {
    return new ListAdminMembersQuery(
      params.currentPage ?? 1,
      params.countPerPage ?? 20,
      params.keyword,
      params.status,
    );
  }
}
