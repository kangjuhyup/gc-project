import { describe, expect, it, vi } from 'vitest';
import { ListScreeningSeatsQuery } from '@application/query/dto';
import { MikroOrmSeatQueryRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmSeatQueryRepository', () => {
  it('상영 좌석을 예매 완료, 임시 점유, 예매 가능 상태로 매핑한다', async () => {
    const entityManager = {
      execute: vi.fn().mockResolvedValue([
        createRow({ seatId: '1001', seatRow: 'A', seatCol: '1', status: 'RESERVED' }),
        createRow({ seatId: '1002', seatRow: 'A', seatCol: '2', status: 'HELD' }),
        createRow({ seatId: '1003', seatRow: 'A', seatCol: '3', status: 'AVAILABLE' }),
      ]),
    };
    const repository = new MikroOrmSeatQueryRepository(entityManager as never);

    const result = await repository.listByScreening(ListScreeningSeatsQuery.of({ screeningId: '101' }));

    const [sql, params] = entityManager.execute.mock.calls[0] as [string, string[]];
    expect(sql).toContain("reserved.status IN ('PENDING', 'CONFIRMED')");
    expect(sql).toContain("active_hold.status = 'HELD'");
    expect(sql).toContain('active_hold.expires_at > now()');
    expect(sql).toContain('ORDER BY seat.seat_row ASC, seat.seat_col ASC, seat.id ASC');
    expect(params).toEqual(['101']);
    expect(result).toEqual({
      screeningId: '101',
      seats: [
        { id: '1001', row: 'A', col: 1, type: 'NORMAL', status: 'RESERVED' },
        { id: '1002', row: 'A', col: 2, type: 'NORMAL', status: 'HELD' },
        { id: '1003', row: 'A', col: 3, type: 'NORMAL', status: 'AVAILABLE' },
      ],
    });
  });
});

function createRow(params: {
  seatId: string;
  seatRow: string;
  seatCol: string;
  status: 'RESERVED' | 'HELD' | 'AVAILABLE';
}) {
  return {
    seatId: params.seatId,
    seatRow: params.seatRow,
    seatCol: params.seatCol,
    seatType: 'NORMAL',
    status: params.status,
  };
}
