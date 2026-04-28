export const PhoneVerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  EXPIRED: 'EXPIRED',
} as const;

export type PhoneVerificationStatus = (typeof PhoneVerificationStatus)[keyof typeof PhoneVerificationStatus];
