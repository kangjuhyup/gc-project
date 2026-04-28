import { describe, expect, it, vi } from 'vitest';
import { CheckUserIdAvailabilityQuery } from '../../../src/application/query/dto';
import { CheckUserIdAvailabilityQueryHandler } from '../../../src/application/query/handlers';
import type { MemberQueryPort } from '../../../src/application/query/ports';

describe('CheckUserIdAvailabilityQueryHandler', () => {
  it('returns unavailable when user id already exists', async () => {
    const memberQuery = {
      existsByUserId: vi.fn().mockResolvedValue(true),
    } satisfies MemberQueryPort;
    const handler = new CheckUserIdAvailabilityQueryHandler(memberQuery);

    const result = await handler.execute(CheckUserIdAvailabilityQuery.of({ userId: 'member_01' }));

    expect(result.available).toBe(false);
  });

  it('returns available when user id does not exist', async () => {
    const memberQuery = {
      existsByUserId: vi.fn().mockResolvedValue(false),
    } satisfies MemberQueryPort;
    const handler = new CheckUserIdAvailabilityQueryHandler(memberQuery);

    const result = await handler.execute(CheckUserIdAvailabilityQuery.of({ userId: 'member_01' }));

    expect(result.available).toBe(true);
  });
});
