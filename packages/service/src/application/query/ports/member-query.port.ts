export const MEMBER_QUERY = Symbol('MEMBER_QUERY');

export interface MemberQueryPort {
  existsByUserId(userId: string): Promise<boolean>;
}
