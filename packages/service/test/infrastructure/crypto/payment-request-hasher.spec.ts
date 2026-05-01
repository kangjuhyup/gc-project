import { describe, expect, it } from 'vitest';
import { Sha256PaymentRequestHasher } from '@infrastructure/crypto';

describe('Sha256PaymentRequestHasher', () => {
  it('동일한 결제 요청 필드는 항상 같은 SHA-256 requestHash를 생성한다', () => {
    const hasher = new Sha256PaymentRequestHasher();

    const first = hasher.hash({
      memberId: '1',
      seatHoldId: '9001',
      provider: 'LOCAL',
      amount: 15000,
    });
    const second = hasher.hash({
      provider: 'LOCAL',
      amount: 15000,
      memberId: '1',
      seatHoldId: '9001',
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('결제 요청 필드가 달라지면 다른 requestHash를 생성한다', () => {
    const hasher = new Sha256PaymentRequestHasher();

    const original = hasher.hash({
      memberId: '1',
      seatHoldId: '9001',
      provider: 'LOCAL',
      amount: 15000,
    });
    const changed = hasher.hash({
      memberId: '1',
      seatHoldId: '9002',
      provider: 'LOCAL',
      amount: 15000,
    });

    expect(changed).not.toBe(original);
  });

  it('여러 좌석 결제 요청은 좌석 순서가 달라도 같은 requestHash를 생성한다', () => {
    const hasher = new Sha256PaymentRequestHasher();

    const first = hasher.hash({
      memberId: '1',
      seatHoldIds: ['9002', '9001'],
      provider: 'LOCAL',
      amount: 30000,
    });
    const second = hasher.hash({
      memberId: '1',
      seatHoldIds: ['9001', '9002'],
      provider: 'LOCAL',
      amount: 30000,
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});
