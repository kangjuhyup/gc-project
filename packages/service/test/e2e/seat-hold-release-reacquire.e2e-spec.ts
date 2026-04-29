import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('좌석 임시점유 해제 후 재점유 e2e', () => {
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

  it('회원이 임시점유를 해제하면 같은 좌석을 다른 회원이 다시 점유할 수 있다', async () => {
    const memberA = await e2e.signupAndLogin('release_a');
    const memberB = await e2e.signupAndLogin('release_b');
    const screeningId = await e2e.firstScreeningId();
    const [seat] = await e2e.availableSeats(screeningId);

    const holdByA = await e2e.createSeatHold(memberA, screeningId, [seat.id]);
    expect(holdByA.status).toBe(201);
    expect(await e2e.seatStatus(screeningId, seat.id)).toBe('HELD');

    const releaseByA = await e2e.delete(`/seat-holds/${String((holdByA.body.holdIds as string[])[0])}`, e2e.auth(memberA));
    expect(releaseByA.status).toBe(200);
    expect(releaseByA.body).toMatchObject({ released: true });
    expect(await e2e.seatStatus(screeningId, seat.id)).toBe('AVAILABLE');

    const holdByB = await e2e.createSeatHold(memberB, screeningId, [seat.id]);
    expect(holdByB.status).toBe(201);
    expect(holdByB.body.seatIds).toEqual([seat.id]);
  });
});
