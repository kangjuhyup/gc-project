import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('결제 요청 멱등성 e2e', () => {
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

  it('같은 idempotency key로 결제를 반복 요청하면 결제가 중복 생성되지 않는다', async () => {
    const member = await e2e.signupAndLogin('idempotency');
    const screeningId = await e2e.firstScreeningId();
    const [seat] = await e2e.availableSeats(screeningId);

    const hold = await e2e.createSeatHold(member, screeningId, [seat.id]);
    expect(hold.status).toBe(201);
    const holdId = String((hold.body.holdIds as string[])[0]);

    const firstPayment = await e2e.requestPayment(member, holdId, 'pay-idempotency-0001');
    expect(firstPayment.status).toBe(201);

    const secondPayment = await e2e.requestPayment(member, holdId, 'pay-idempotency-0001');
    expect(secondPayment.status).toBe(201);
    expect(secondPayment.body.paymentId).toBe(firstPayment.body.paymentId);
    expect(secondPayment.body).toMatchObject({
      seatHoldId: holdId,
      idempotencyKey: 'pay-idempotency-0001',
      status: 'PENDING',
    });

    expect(await e2e.countRows('payment', 'member_id = ? AND idempotency_key = ?', [
      member.memberId,
      'pay-idempotency-0001',
    ])).toBe(1);
    expect(await e2e.countRows('outbox_event', "aggregate_type = 'PAYMENT' AND event_type = 'PAYMENT_REQUESTED'")).toBe(1);
  });
});
