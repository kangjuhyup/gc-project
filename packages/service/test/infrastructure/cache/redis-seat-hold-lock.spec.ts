import { describe, expect, it, vi } from 'vitest';
import { RedisSeatHoldLock } from '@infrastructure/cache';

describe('RedisSeatHoldLock', () => {
  it('좌석별 RedLock 키를 PX NX 옵션으로 획득한다', async () => {
    const redis = {
      set: vi.fn().mockResolvedValue('OK'),
      eval: vi.fn(),
    };
    const lock = new RedisSeatHoldLock(redis as never);

    const result = await lock.acquire({
      screeningId: '101',
      seatIds: ['1002', '1001'],
      ttlMilliseconds: 3000,
    });

    expect(result).toBeDefined();
    expect(result?.screeningId).toBe('101');
    expect(result?.seatIds).toEqual(['1001', '1002']);
    expect(redis.set).toHaveBeenNthCalledWith(
      1,
      'seat-hold-lock:101:1001',
      expect.any(String),
      'PX',
      3000,
      'NX',
    );
    expect(redis.set).toHaveBeenNthCalledWith(
      2,
      'seat-hold-lock:101:1002',
      expect.any(String),
      'PX',
      3000,
      'NX',
    );
  });

  it('일부 좌석 RedLock 획득에 실패하면 이미 획득한 락을 해제한다', async () => {
    const redis = {
      set: vi.fn().mockResolvedValueOnce('OK').mockResolvedValueOnce(undefined),
      eval: vi.fn(),
    };
    const lock = new RedisSeatHoldLock(redis as never);

    const result = await lock.acquire({
      screeningId: '101',
      seatIds: ['1001', '1002'],
      ttlMilliseconds: 3000,
    });

    expect(result).toBeUndefined();
    expect(redis.eval).toHaveBeenCalledOnce();
    expect(redis.eval.mock.calls[0][2]).toBe('seat-hold-lock:101:1001');
  });

  it('RedLock 해제 시 토큰이 일치하는 키만 삭제한다', async () => {
    const redis = {
      set: vi.fn(),
      eval: vi.fn(),
    };
    const lock = new RedisSeatHoldLock(redis as never);

    await lock.release({
      screeningId: '101',
      seatIds: ['1001'],
      token: 'lock-token',
    });

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("GET", KEYS[1]) == ARGV[1]'),
      1,
      'seat-hold-lock:101:1001',
      'lock-token',
    );
  });
});
