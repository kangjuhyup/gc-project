import { describe, expect, it, vi } from 'vitest';
import { MikroOrmReservationRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmReservationRepository', () => {
  it('관람 종료 전 PENDING 또는 CONFIRMED 예매가 있으면 미완료 예매가 있다고 판단한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValue({ id: '5001' }),
    };
    const repository = new MikroOrmReservationRepository(entityManager as never);
    const now = new Date('2026-05-02T10:00:00.000Z');

    const result = await repository.hasIncompleteReservationByMemberId({
      memberId: 'member-1',
      now,
    });

    expect(result).toBe(true);
    expect(entityManager.findOne).toHaveBeenCalledWith(expect.any(Function), {
      member: 'member-1',
      status: { $in: ['PENDING', 'CONFIRMED'] },
      screening: {
        endAt: { $gt: now },
      },
    });
  });

  it('관람 종료 전 PENDING 또는 CONFIRMED 예매가 없으면 미완료 예매가 없다고 판단한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValue(null),
    };
    const repository = new MikroOrmReservationRepository(entityManager as never);

    const result = await repository.hasIncompleteReservationByMemberId({
      memberId: 'member-1',
      now: new Date('2026-05-02T10:00:00.000Z'),
    });

    expect(result).toBe(false);
  });
});
