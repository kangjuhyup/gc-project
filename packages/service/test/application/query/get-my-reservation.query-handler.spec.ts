import { describe, expect, it, vi } from 'vitest';
import { GetMyReservationQuery, ReservationDetailDto } from '@application';
import { GetMyReservationQueryHandler } from '@application/query/handlers';
import type { ReservationQueryPort } from '@application/query/ports';

describe('GetMyReservationQueryHandler', () => {
  it('내 예매 상세 조회를 reservation query port에 위임한다', async () => {
    const reservation = ReservationDetailDto.of({
      id: '5001',
      reservationNumber: 'R00000000000005001',
      status: 'CONFIRMED',
      totalPrice: 15000,
      paymentAmount: 15000,
      createdAt: '2026-04-30T10:20:00.000Z',
      movie: {
        id: '1',
        title: '파묘',
      },
      screening: {
        id: '101',
        screenName: '1관',
        startAt: '2026-04-30T11:00:00.000Z',
        endAt: '2026-04-30T13:00:00.000Z',
        theater: {
          id: '1',
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
        },
      },
      seats: [],
    });
    const reservationQuery: ReservationQueryPort = {
      listMyReservations: vi.fn(),
      getMyReservation: vi.fn(async () => reservation),
    };
    const handler = new GetMyReservationQueryHandler(reservationQuery);

    const result = await handler.execute(
      GetMyReservationQuery.of({
        memberId: '1',
        reservationId: '5001',
      }),
    );

    expect(reservationQuery.getMyReservation).toHaveBeenCalledWith(
      GetMyReservationQuery.of({
        memberId: '1',
        reservationId: '5001',
      }),
    );
    expect(result).toBe(reservation);
  });

  it('내 예매 상세가 없으면 예매 없음 오류를 던진다', async () => {
    const reservationQuery: ReservationQueryPort = {
      listMyReservations: vi.fn(),
      getMyReservation: vi.fn(async () => undefined),
    };
    const handler = new GetMyReservationQueryHandler(reservationQuery);

    await expect(
      handler.execute(GetMyReservationQuery.of({ memberId: '1', reservationId: '5001' })),
    ).rejects.toThrow('RESERVATION_NOT_FOUND');
  });
});
