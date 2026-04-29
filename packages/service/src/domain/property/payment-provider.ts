export const PaymentProvider = {
  LOCAL: 'LOCAL',
  KAKAO: 'KAKAO',
  TOSS: 'TOSS',
  NAVER: 'NAVER',
} as const;

export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];
