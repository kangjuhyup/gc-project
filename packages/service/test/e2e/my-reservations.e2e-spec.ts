import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext, type E2eMember, type E2eSeat } from './support/service-e2e';

describe('내 예매 목록 조회 e2e', () => {
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

  it('내 예매 목록을 최신순 커서 페이지네이션으로 조회한다', async () => {
    const member = await e2e.signupAndLogin('my_res');
    const screeningId = await e2e.firstScreeningId();
    const seats = await e2e.availableSeats(screeningId, 3);

    await createApprovedReservation(e2e, member, screeningId, seats[0], 'pay-my-res-0001');
    await createApprovedReservation(e2e, member, screeningId, seats[1], 'pay-my-res-0002');
    await createApprovedReservation(e2e, member, screeningId, seats[2], 'pay-my-res-0003');

    const firstPage = await e2e.get('/reservations?limit=2', e2e.auth(member));
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.hasNext).toBe(true);
    expect(firstPage.body.nextCursor).toEqual(expect.any(String));
    expect(firstPage.body.items).toEqual([
      expect.objectContaining({
        status: 'CONFIRMED',
        movie: expect.objectContaining({ title: expect.any(String) }),
        screening: expect.objectContaining({
          id: screeningId,
          theater: expect.objectContaining({ name: expect.any(String) }),
        }),
        seats: [expect.objectContaining({ id: seats[2].id })],
        payment: expect.objectContaining({ status: 'APPROVED' }),
      }),
      expect.objectContaining({
        seats: [expect.objectContaining({ id: seats[1].id })],
      }),
    ]);

    const secondPage = await e2e.get(`/reservations?limit=2&cursor=${firstPage.body.nextCursor}`, e2e.auth(member));
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.hasNext).toBe(false);
    expect(secondPage.body.nextCursor).toBeUndefined();
    const secondPageItems = secondPage.body.items as Array<Record<string, unknown>>;
    expect(secondPageItems[0]).toEqual(expect.objectContaining({
      seats: [expect.objectContaining({ id: seats[0].id })],
    }));
  });

  it('내 예매 상세에서 예매번호, 영화, 상영시간, 좌석, 결제금액, 상태를 조회한다', async () => {
    const member = await e2e.signupAndLogin('my_res_detail');
    const otherMember = await e2e.signupAndLogin('my_res_other');
    const screeningId = await e2e.firstScreeningId();
    const [seat] = await e2e.availableSeats(screeningId, 1);

    await createApprovedReservation(e2e, member, screeningId, seat, 'pay-my-res-detail-0001');

    const reservations = await e2e.get('/reservations?limit=1', e2e.auth(member));
    expect(reservations.status).toBe(200);
    const reservation = (reservations.body.items as Array<Record<string, unknown>>)[0];
    expect(reservation).toBeDefined();

    const detail = await e2e.get(`/reservations/${reservation.id}`, e2e.auth(member));
    expect(detail.status).toBe(200);
    expect(detail.body).toEqual(expect.objectContaining({
      id: reservation.id,
      reservationNumber: expect.stringMatching(/^R[0-9]+$/),
      status: 'CONFIRMED',
      totalPrice: 15000,
      paymentAmount: 15000,
      movie: expect.objectContaining({
        title: expect.any(String),
      }),
      screening: expect.objectContaining({
        id: screeningId,
        startAt: expect.any(String),
        endAt: expect.any(String),
      }),
      seats: [
        expect.objectContaining({
          id: seat.id,
          row: seat.row,
          col: seat.col,
        }),
      ],
      payment: expect.objectContaining({
        amount: 15000,
        status: 'APPROVED',
      }),
    }));

    const otherMemberDetail = await e2e.get(`/reservations/${reservation.id}`, e2e.auth(otherMember));
    expect(otherMemberDetail.status).toBe(404);
  });
});

async function createApprovedReservation(
  e2e: ServiceE2eContext,
  member: E2eMember,
  screeningId: string,
  seat: E2eSeat,
  idempotencyKey: string,
): Promise<void> {
  const hold = await e2e.createSeatHold(member, screeningId, [seat.id]);
  expect(hold.status).toBe(201);

  const payment = await e2e.requestPayment(member, String((hold.body.holdIds as string[])[0]), idempotencyKey);
  expect(payment.status).toBe(201);

  const callback = await e2e.approvePayment(payment.body);
  expect(callback.status).toBe(201);
}
