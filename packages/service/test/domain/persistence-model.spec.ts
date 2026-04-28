import { describe, expect, it } from 'vitest';
import { MemberModel } from '@domain';

describe('PersistenceModel', () => {
  it('프레임워크 의존성 없이 persistence 필드를 설정한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const updatedAt = new Date('2026-04-28T01:00:00.000Z');

    const member = MemberModel.of({
      userId: 'member_01',
      passwordHash: 'hashed-password',
      name: 'Member',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      phoneNumber: '01000000000',
      address: 'Seoul',
      status: 'ACTIVE',
      failedLoginCount: 0,
    }).setPersistence('1', createdAt, updatedAt);

    expect(member.id).toBe('1');
    expect(member.createdAt).toBe(createdAt);
    expect(member.updatedAt).toBe(updatedAt);
  });
});
