import { describe, expect, it } from 'vitest';
import { MemberModel } from '@domain';

describe('PersistenceModel', () => {
  it('프레임워크 의존성 없이 persistence 필드를 설정한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const updatedAt = new Date('2026-04-28T01:00:00.000Z');

    const member = MemberModel.of({
      email: 'member@example.com',
      password: 'hashed-password',
      name: 'Member',
      status: 'ACTIVE',
    }).setPersistence('1', createdAt, updatedAt);

    expect(member.id).toBe('1');
    expect(member.createdAt).toBe(createdAt);
    expect(member.updatedAt).toBe(updatedAt);
  });
});
