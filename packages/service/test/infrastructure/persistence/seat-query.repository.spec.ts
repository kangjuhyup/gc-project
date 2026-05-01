import { describe, expect, it, vi } from 'vitest';
import { ListScreeningSeatsQuery } from '@application/query/dto';
import { MikroOrmSeatQueryRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmSeatQueryRepository', () => {
  it('상영 좌석을 예매 완료, 임시 점유, 예매 가능 상태로 매핑한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValue(createScreening()),
    };
    const repository = new MikroOrmSeatQueryRepository(entityManager as never);

    const result = await repository.listByScreening(ListScreeningSeatsQuery.of({ screeningId: '101' }));

    expect(entityManager.findOne).toHaveBeenCalledWith(expect.any(Function), { id: '101' }, {
      populate: [
        'screen.seats',
        'reservationSeats.seat',
        'reservationSeats.reservation',
        'seatHolds.seat',
      ],
    });
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

function createScreening() {
  const reservedSeat = createSeat('1001', 1);
  const heldSeat = createSeat('1002', 2);
  const availableSeat = createSeat('1003', 3);

  return {
    screen: {
      seats: collection([reservedSeat, heldSeat, availableSeat]),
    },
    reservationSeats: collection([
      {
        seat: reservedSeat,
        reservation: { status: 'CONFIRMED' },
      },
    ]),
    seatHolds: collection([
      {
        seat: heldSeat,
        status: 'HELD',
        expiresAt: new Date(Date.now() + 60_000),
      },
    ]),
  };
}

function createSeat(id: string, col: number) {
  return {
    id,
    seatRow: 'A',
    seatCol: col,
    seatType: 'NORMAL',
  };
}

function collection<T>(items: T[]) {
  return {
    getItems: () => items,
  };
}
