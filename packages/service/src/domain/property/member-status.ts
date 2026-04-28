export const MemberStatus = {
  ACTIVE: 'ACTIVE',
  DORMANT: 'DORMANT',
  LOCKED: 'LOCKED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];
