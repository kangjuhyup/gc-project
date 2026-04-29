import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

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

  it('환경변수로 지정한 TTL이 지나면 좌석 점유가 만료되어 같은 좌석을 다시 점유할 수 있다', async () => {
    const memberA = await e2e.signupAndLogin('ttl_a');
    const memberB = await e2e.signupAndLogin('ttl_b');
    const screeningId = await e2e.firstScreeningId();
    const [seat] = await e2e.availableSeats(screeningId);

    const holdByA = await e2e.createSeatHold(memberA, screeningId, [seat.id]);
    expect(holdByA.status).toBe(201);
    expect(holdByA.body.ttlSeconds).toBe(1);
    expect(await e2e.apiSeatStatus(screeningId, seat.id)).toBe('HELD');
    expect(await e2e.redis.exists(`seat-hold:${screeningId}:${seat.id}`)).toBe(1);

    await wait(1_200);

    expect(await e2e.redis.exists(`seat-hold:${screeningId}:${seat.id}`)).toBe(0);
    expect(await e2e.apiSeatStatus(screeningId, seat.id)).toBe('AVAILABLE');

    const holdByB = await e2e.createSeatHold(memberB, screeningId, [seat.id]);
    expect(holdByB.status).toBe(201);
    expect(holdByB.body.seatIds).toEqual([seat.id]);
  });
});
