import type { MemberStatusType } from '@domain';

export class ListAdminMembersQuery {
  private constructor(
    readonly limit: number,
    readonly keyword?: string,
    readonly status?: MemberStatusType,
    readonly cursor?: string,
  ) {}

  static of(params: {
    limit?: number;
    keyword?: string;
    status?: MemberStatusType;
    cursor?: string;
  }): ListAdminMembersQuery {
    return new ListAdminMembersQuery(
      params.limit ?? 20,
      params.keyword,
      params.status,
      params.cursor,
    );
  }
}
