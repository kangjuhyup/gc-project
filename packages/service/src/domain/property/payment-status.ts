export const PaymentStatus = {
  PENDING: 'PENDING',
  APPROVING: 'APPROVING',
  APPROVED: 'APPROVED',
  FAILED: 'FAILED',
  REFUND_REQUIRED: 'REFUND_REQUIRED',
  REFUNDING: 'REFUNDING',
  REFUNDED: 'REFUNDED',
  REFUND_FAILED: 'REFUND_FAILED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
