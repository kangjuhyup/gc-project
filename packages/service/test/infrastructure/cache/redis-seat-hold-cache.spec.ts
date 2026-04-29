import { describe, expect, it, vi } from 'vitest';
import { RedisSeatHoldCache } from '@infrastructure/cache';
import { SeatHoldModel, SeatHoldStatus } from '@domain';

describe('RedisSeatHoldCache', () => {
  it('좌석 임시점유 키를 NX와 13분 TTL로 저장한다', async () => {
    const redis = {
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn(),
    };
    const cache = new RedisSeatHoldCache(redis as never);
    const hold = SeatHoldModel.of({
      screeningId: '101',
      seatId: '1001',
      memberId: '1',
      status: SeatHoldStatus.HELD,
      expiresAt: new Date('2026-04-29T00:13:00.000Z'),
    });

    const result = await cache.hold(hold, 13 * 60);

    expect(result).toBe(true);
    expect(redis.set).toHaveBeenCalledWith(
      'seat-hold:101:1001',
      JSON.stringify({
        screeningId: '101',
        seatId: '1001',
        memberId: '1',
        expiresAt: '2026-04-29T00:13:00.000Z',
      }),
      'EX',
      13 * 60,
      'NX',
    );
  });

  it('이미 Redis에 임시점유 키가 있으면 실패로 반환한다', async () => {
    const redis = {
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn(),
    };
    const cache = new RedisSeatHoldCache(redis as never);

    const result = await cache.hold(
      SeatHoldModel.of({
        screeningId: '101',
        seatId: '1001',
        memberId: '1',
        status: SeatHoldStatus.HELD,
        expiresAt: new Date('2026-04-29T00:13:00.000Z'),
      }),
      13 * 60,
    );

    expect(result).toBe(false);
  });
});
