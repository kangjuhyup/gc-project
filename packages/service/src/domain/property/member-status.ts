export const MemberStatus = {
  ACTIVE: 'ACTIVE',
  DORMANT: 'DORMANT',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];
