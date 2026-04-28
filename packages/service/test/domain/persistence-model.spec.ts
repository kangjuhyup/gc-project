import { describe, expect, it } from 'vitest';
import { MemberModel } from '../../src/domain';

describe('PersistenceModel', () => {
  it('sets persistence fields without exposing framework dependencies', () => {
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
