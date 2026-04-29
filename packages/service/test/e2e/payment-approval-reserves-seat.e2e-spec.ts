import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('결제 승인 후 좌석 예매 완료 e2e', () => {
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

  it('결제 승인 callback이 처리되면 좌석은 예매 완료 상태가 되고 다시 점유할 수 없다', async () => {
    const memberA = await e2e.signupAndLogin('approve_a');
    const memberB = await e2e.signupAndLogin('approve_b');
    const screeningId = await e2e.firstScreeningId();
    const [seat] = await e2e.availableSeats(screeningId);

    const hold = await e2e.createSeatHold(memberA, screeningId, [seat.id]);
    expect(hold.status).toBe(201);

    const payment = await e2e.requestPayment(memberA, String((hold.body.holdIds as string[])[0]), 'pay-approval-0001');
    expect(payment.status).toBe(201);
    expect(payment.body.status).toBe('PENDING');

    const callback = await e2e.approvePayment(payment.body);
    expect(callback.status).toBe(201);
    expect(callback.body).toMatchObject({ handled: true });

    expect(await e2e.seatStatus(screeningId, seat.id)).toBe('RESERVED');

    const duplicateHoldByB = await e2e.createSeatHold(memberB, screeningId, [seat.id]);
    expect(duplicateHoldByB.status).toBe(409);

    expect(await e2e.countRows('reservation', 'member_id = ?', [memberA.memberId])).toBe(1);
    expect(await e2e.countRows('reservation_seat', 'screening_id = ? AND seat_id = ?', [screeningId, seat.id])).toBe(1);
    expect(await e2e.countRows('reservation_event')).toBe(1);
  });
});
