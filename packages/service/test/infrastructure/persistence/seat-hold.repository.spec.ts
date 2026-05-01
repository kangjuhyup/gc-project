import { describe, expect, it, vi } from 'vitest';
import { MikroOrmSeatHoldRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmSeatHoldRepository', () => {
  it('예약 좌석과 아직 만료되지 않은 임시점유 좌석을 사용 불가 좌석으로 조회한다', async () => {
    const entityManager = {
      find: vi.fn()
        .mockResolvedValueOnce([{ seat: { id: '1001' } }])
        .mockResolvedValueOnce([{ seat: { id: '1002' } }]),
    };
    const repository = new MikroOrmSeatHoldRepository(entityManager as never);
    const now = new Date('2026-04-29T00:00:00.000Z');

    const result = await repository.findUnavailableSeatIds({
      screeningId: '101',
      seatIds: ['1001', '1002'],
      now,
    });

    expect(entityManager.find).toHaveBeenNthCalledWith(1, expect.any(Function), {
      screening: '101',
      seat: { $in: ['1001', '1002'] },
      reservation: { status: { $in: ['PENDING', 'CONFIRMED'] } },
    }, { populate: ['seat'] });
    expect(entityManager.find).toHaveBeenNthCalledWith(2, expect.any(Function), {
      screening: '101',
      seat: { $in: ['1001', '1002'] },
      status: 'HELD',
      expiresAt: { $gt: now },
    }, { populate: ['seat'] });
    expect(result).toEqual(['1001', '1002']);
  });

  it('상영관에 속한 좌석만 임시점유 대상 좌석으로 조회한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValue({ screen: { id: '10' } }),
      find: vi.fn().mockResolvedValue([{ id: '1001' }, { id: '1002' }]),
    };
    const repository = new MikroOrmSeatHoldRepository(entityManager as never);

    const result = await repository.findSeatIdsInScreening({
      screeningId: '101',
      seatIds: ['1001', '1002'],
    });

    expect(entityManager.findOne).toHaveBeenCalledWith(expect.any(Function), { id: '101' }, { populate: ['screen'] });
    expect(entityManager.find).toHaveBeenCalledWith(expect.any(Function), {
      id: { $in: ['1001', '1002'] },
      screen: '10',
    }, { orderBy: { id: 'ASC' } });
    expect(result).toEqual(['1001', '1002']);
  });
});
