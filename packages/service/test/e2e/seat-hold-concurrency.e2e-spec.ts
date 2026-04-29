import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('좌석 임시점유 경쟁 e2e', () => {
  let e2e: ServiceE2eContext;

  beforeAll(async () => {
    e2e = await ServiceE2eContext.create();
  });

  beforeEach(async () => {
    await e2e.reset();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it('한 회원이 임시점유한 좌석은 다른 회원이 중복 점유할 수 없고 다른 좌석은 점유할 수 있다', async () => {
    const memberA = await e2e.signupAndLogin('hold_a');
    const memberB = await e2e.signupAndLogin('hold_b');
    const screeningId = await e2e.firstScreeningId();
    const [seatForA, seatForB] = await e2e.availableSeats(screeningId, 2);

    const holdByA = await e2e.createSeatHold(memberA, screeningId, [seatForA.id]);
    expect(holdByA.status).toBe(201);
    expect(holdByA.body.ttlSeconds).toBe(600);
    expect(holdByA.body.holdIds).toHaveLength(1);

    const redisKeys = await e2e.redis.keys(`seat-hold:${screeningId}:*`);
    expect(redisKeys.length).toBeGreaterThan(0);
    expect(await e2e.apiSeatStatus(screeningId, seatForA.id)).toBe('HELD');

    const duplicateHoldByB = await e2e.createSeatHold(memberB, screeningId, [seatForA.id]);
    expect(duplicateHoldByB.status).toBe(409);

    const holdByB = await e2e.createSeatHold(memberB, screeningId, [seatForB.id]);
    expect(holdByB.status).toBe(201);
    expect(holdByB.body.seatIds).toEqual([seatForB.id]);
  });
});
