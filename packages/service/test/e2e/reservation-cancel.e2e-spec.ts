import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

describe('예매 취소 e2e', () => {
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

  it('내가 결제 완료한 예매를 취소하면 좌석은 예매 가능 상태가 되고 환불 요청 로그가 남는다', async () => {
    const memberA = await e2e.signupAndLogin('cancel_a');
    const memberB = await e2e.signupAndLogin('cancel_b');
    const screeningId = await e2e.firstScreeningId();
    const [seat] = await e2e.availableSeats(screeningId, 1);

    const hold = await e2e.createSeatHold(memberA, screeningId, [seat.id]);
    expect(hold.status).toBe(201);
    const payment = await e2e.requestPayment(
      memberA,
      String((hold.body.holdIds as string[])[0]),
      'pay-cancel-0001',
    );
    expect(payment.status).toBe(201);
    const callback = await e2e.approvePayment(payment.body);
    expect(callback.status).toBe(201);

    const approvedPayment = await e2e.findPayment(String(payment.body.paymentId));
    const reservationId = String(approvedPayment?.reservationId);
    expect(reservationId).toEqual(expect.stringMatching(/^[1-9][0-9]*$/));

    const forbidden = await e2e.post(
      `/reservations/${reservationId}/cancel`,
      { reason: 'other user' },
      e2e.auth(memberB),
    );
    expect(forbidden.status).toBe(403);

    const canceled = await e2e.post(
      `/reservations/${reservationId}/cancel`,
      { reason: 'user request' },
      e2e.auth(memberA),
    );
    expect(canceled.status).toBe(201);
    expect(canceled.body.reservationStatus).toBe('CANCELED');
    expect(canceled.body.paymentStatus).toBe('REFUND_REQUIRED');

    expect(await e2e.apiSeatStatus(screeningId, seat.id)).toBe('AVAILABLE');
    expect(
      await e2e.countRows('payment', "id = ? AND status = 'REFUND_REQUIRED'", [
        payment.body.paymentId,
      ]),
    ).toBe(1);
    expect(
      await e2e.countRows('reservation', "id = ? AND status = 'CANCELED'", [reservationId]),
    ).toBe(1);
    expect(
      await e2e.countRows(
        'payment_event_log',
        "payment_id = ? AND event_type = 'PAYMENT_REFUND_REQUESTED'",
        [payment.body.paymentId],
      ),
    ).toBe(1);
  });

  it('여러 좌석을 하나의 결제로 예매한 경우 취소도 한 번에 처리한다', async () => {
    const member = await e2e.signupAndLogin('cancel_multi');
    const screeningId = await e2e.firstScreeningId();
    const seats = await e2e.availableSeats(screeningId, 3);

    const hold = await e2e.createSeatHold(
      member,
      screeningId,
      seats.map((seat) => seat.id),
    );
    expect(hold.status).toBe(201);
    const payment = await e2e.requestPayment(
      member,
      hold.body.holdIds as string[],
      'pay-cancel-multi-0001',
      45000,
    );
    expect(payment.status).toBe(201);
    const callback = await e2e.approvePayment(payment.body, 45000);
    expect(callback.status).toBe(201);

    const approvedPayment = await e2e.findPayment(String(payment.body.paymentId));
    const reservationId = String(approvedPayment?.reservationId);
    expect(reservationId).toEqual(expect.stringMatching(/^[1-9][0-9]*$/));

    const canceled = await e2e.post(
      `/reservations/${reservationId}/cancel`,
      { reason: 'multi seat cancel' },
      e2e.auth(member),
    );
    expect(canceled.status).toBe(201);
    expect(canceled.body).toMatchObject({
      paymentId: String(payment.body.paymentId),
      paymentStatus: 'REFUND_REQUIRED',
      reservationId,
      reservationStatus: 'CANCELED',
    });

    await Promise.all(
      seats.map(async (seat) => {
        expect(await e2e.apiSeatStatus(screeningId, seat.id)).toBe('AVAILABLE');
      }),
    );
    expect(
      await e2e.countRows('payment', "id = ? AND status = 'REFUND_REQUIRED'", [
        payment.body.paymentId,
      ]),
    ).toBe(1);
    expect(
      await e2e.countRows('reservation', "id = ? AND status = 'CANCELED'", [reservationId]),
    ).toBe(1);
    expect(
      await e2e.countRows(
        'payment_event_log',
        "payment_id = ? AND event_type = 'PAYMENT_REFUND_REQUESTED'",
        [payment.body.paymentId],
      ),
    ).toBe(1);
  });
});
