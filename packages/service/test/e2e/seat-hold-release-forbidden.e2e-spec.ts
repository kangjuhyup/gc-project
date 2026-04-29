import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('다른 회원 좌석 임시점유 해제 차단 e2e', () => {
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

  it('다른 회원이 만든 좌석 임시점유는 해제할 수 없고 좌석은 계속 임시점유 상태로 남는다', async () => {
    const memberA = await e2e.signupAndLogin('forbidden_a');
    const memberB = await e2e.signupAndLogin('forbidden_b');
    const screeningId = await e2e.firstScreeningId();
    const [seat] = await e2e.availableSeats(screeningId);

    const holdByA = await e2e.createSeatHold(memberA, screeningId, [seat.id]);
    expect(holdByA.status).toBe(201);

    const releaseByB = await e2e.delete(`/seat-holds/${String((holdByA.body.holdIds as string[])[0])}`, e2e.auth(memberB));
    expect(releaseByB.status).toBe(403);
    expect(await e2e.seatStatus(screeningId, seat.id)).toBe('HELD');

    const duplicateHoldByB = await e2e.createSeatHold(memberB, screeningId, [seat.id]);
    expect(duplicateHoldByB.status).toBe(409);
  });
});
