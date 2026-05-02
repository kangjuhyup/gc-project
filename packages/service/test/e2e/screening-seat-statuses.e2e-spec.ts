import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('상영 좌석 상태 목록 e2e', () => {
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

  it('상영 좌석 목록은 예매 가능, 임시점유, 예매 완료 상태를 함께 반환한다', async () => {
    const memberA = await e2e.signupAndLogin('statuses_a');
    const memberB = await e2e.signupAndLogin('statuses_b');
    const screeningId = await e2e.firstScreeningId();
    const [reservedSeat, heldSeat, availableSeat] = await e2e.availableSeats(screeningId, 3);

    const holdForReservation = await e2e.createSeatHold(memberA, screeningId, [reservedSeat.id]);
    expect(holdForReservation.status).toBe(201);
    const payment = await e2e.requestPayment(
      memberA,
      String((holdForReservation.body.holdIds as string[])[0]),
      'pay-statuses-0001',
    );
    expect(payment.status).toBe(201);
    const callback = await e2e.approvePayment(payment.body);
    expect(callback.status).toBe(201);

    const holdOnly = await e2e.createSeatHold(memberB, screeningId, [heldSeat.id]);
    expect(holdOnly.status).toBe(201);

    expect(await e2e.apiSeatStatus(screeningId, reservedSeat.id)).toBe('RESERVED');
    expect(await e2e.apiSeatStatus(screeningId, heldSeat.id)).toBe('HELD');
    expect(await e2e.apiSeatStatus(screeningId, availableSeat.id)).toBe('AVAILABLE');
  });
});
