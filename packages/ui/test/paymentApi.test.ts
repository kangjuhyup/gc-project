import { describe, expect, it } from 'vitest';
import { mapPaymentMethodToProvider } from '@/features/payment/paymentApi';

describe('paymentApi', () => {
  it('UI 결제 수단을 OpenAPI provider 값으로 변환한다', () => {
    expect(mapPaymentMethodToProvider('CARD')).toBe('LOCAL');
    expect(mapPaymentMethodToProvider('KAKAO_PAY')).toBe('KAKAO');
    expect(mapPaymentMethodToProvider('NAVER_PAY')).toBe('NAVER');
  });
});
