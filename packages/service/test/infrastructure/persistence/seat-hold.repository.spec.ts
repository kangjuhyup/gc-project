import { describe, expect, it, vi } from 'vitest';
import { MikroOrmSeatHoldRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmSeatHoldRepository', () => {
  it('예약 좌석과 아직 만료되지 않은 임시점유 좌석을 사용 불가 좌석으로 조회한다', async () => {
    const entityManager = {
      execute: vi.fn().mockResolvedValue([{ seatId: '1001' }]),
    };
    const repository = new MikroOrmSeatHoldRepository(entityManager as never);
    const now = new Date('2026-04-29T00:00:00.000Z');

    const result = await repository.findUnavailableSeatIds({
      screeningId: '101',
      seatIds: ['1001', '1002'],
      now,
    });

    const [sql, params] = entityManager.execute.mock.calls[0] as [string, string[]];
    expect(sql).toContain("reservation.status IN ('PENDING', 'CONFIRMED')");
    expect(sql).toContain("seat_hold.status = 'HELD'");
    expect(sql).toContain('seat_hold.expires_at > ?::timestamptz');
    expect(params).toEqual([
      '101',
      '1001',
      '1002',
      '101',
      '1001',
      '1002',
      '2026-04-29T00:00:00.000Z',
    ]);
    expect(result).toEqual(['1001']);
  });

  it('상영관에 속한 좌석만 임시점유 대상 좌석으로 조회한다', async () => {
    const entityManager = {
      execute: vi.fn().mockResolvedValue([{ seatId: '1001' }, { seatId: '1002' }]),
    };
    const repository = new MikroOrmSeatHoldRepository(entityManager as never);

    const result = await repository.findSeatIdsInScreening({
      screeningId: '101',
      seatIds: ['1001', '1002'],
    });

    const [sql, params] = entityManager.execute.mock.calls[0] as [string, string[]];
    expect(sql).toContain('JOIN screening ON screening.screen_id = seat.screen_id');
    expect(params).toEqual(['101', '1001', '1002']);
    expect(result).toEqual(['1001', '1002']);
  });
});
