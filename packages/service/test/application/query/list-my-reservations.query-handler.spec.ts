import { describe, expect, it, vi } from 'vitest';
import { ListMyReservationsQuery, ReservationListResultDto } from '@application';
import { ListMyReservationsQueryHandler } from '@application/query/handlers';
import type { ReservationQueryPort } from '@application/query/ports';

describe('ListMyReservationsQueryHandler', () => {
  it('내 예매 목록 조회를 reservation query port에 위임한다', async () => {
    const reservations = ReservationListResultDto.of({
      items: [],
      hasNext: false,
    });
    const reservationQuery: ReservationQueryPort = {
      listMyReservations: vi.fn(async () => reservations),
    };
    const handler = new ListMyReservationsQueryHandler(reservationQuery);

    const result = await handler.execute(
      ListMyReservationsQuery.of({
        memberId: '1',
        limit: 10,
        cursor: 'next-cursor',
      }),
    );

    expect(reservationQuery.listMyReservations).toHaveBeenCalledWith(
      ListMyReservationsQuery.of({
        memberId: '1',
        limit: 10,
        cursor: 'next-cursor',
      }),
    );
    expect(result).toBe(reservations);
  });
});
