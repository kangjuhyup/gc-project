import { describe, expect, it, vi } from 'vitest';
import { SeatHoldModel } from '@domain';
import { CreateSeatHoldCommand, ReleaseSeatHoldCommand } from '@application/commands/dto';
import {
  CreateSeatHoldCommandHandler,
  ReleaseSeatHoldCommandHandler,
} from '@application/commands/handlers';
import type {
  ClockPort,
  SeatHoldCachePort,
  SeatHoldLockPort,
  SeatHoldRepositoryPort,
} from '@application/commands/ports';

describe('CreateSeatHoldCommandHandler', () => {
  it('좌석 임시점유 시 환경변수로 전달된 TTL 기준으로 DB와 Redis 만료 시간을 저장한다', async () => {
    const now = new Date('2026-04-29T00:00:00.000Z');
    const clock = { now: vi.fn(() => now) } satisfies ClockPort;
    const repository = {
      save: vi.fn(),
      findById: vi.fn(),
      saveMany: vi.fn(async (holds: SeatHoldModel[]) =>
        holds.map((hold, index) => hold.setPersistence(`hold-${index + 1}`, now, now)),
      ),
      findActiveHold: vi.fn(),
      findUnavailableSeatIds: vi.fn().mockResolvedValue([]),
      findSeatIdsInScreening: vi.fn().mockResolvedValue(['1001', '1002']),
    } satisfies SeatHoldRepositoryPort;
    const cache = {
      hold: vi.fn().mockResolvedValue(true),
      release: vi.fn(),
    } satisfies SeatHoldCachePort;
    const lock = {
      acquire: vi
        .fn()
        .mockResolvedValue({ screeningId: '101', seatIds: ['1001', '1002'], token: 'lock-token' }),
      release: vi.fn(),
    } satisfies SeatHoldLockPort;
    const handler = new CreateSeatHoldCommandHandler(repository, cache, lock, clock, {
      ttlSeconds: 3,
    });

    const result = await handler.execute(
      CreateSeatHoldCommand.of({
        memberId: '1',
        screeningId: '101',
        seatIds: ['1001', '1002'],
      }),
    );

    expect(cache.hold).toHaveBeenCalledTimes(2);
    expect(lock.acquire).toHaveBeenCalledWith({
      screeningId: '101',
      seatIds: ['1001', '1002'],
      ttlMilliseconds: 3000,
    });
    expect(repository.findUnavailableSeatIds).toHaveBeenCalledOnce();
    expect(cache.hold.mock.calls[0][1]).toBe(3);
    expect(lock.release).toHaveBeenCalledWith({
      screeningId: '101',
      seatIds: ['1001', '1002'],
      token: 'lock-token',
    });
    expect(repository.saveMany.mock.calls[0][0][0].expiresAt).toEqual(
      new Date('2026-04-29T00:00:03.000Z'),
    );
    expect(result).toEqual({
      screeningId: '101',
      seatIds: ['1001', '1002'],
      holdIds: ['hold-1', 'hold-2'],
      ttlSeconds: 3,
      expiresAt: new Date('2026-04-29T00:00:03.000Z'),
    });
  });

  it('이미 점유된 좌석이 있으면 Redis와 DB 저장을 시도하지 않는다', async () => {
    const now = new Date('2026-04-29T00:00:00.000Z');
    const repository = {
      save: vi.fn(),
      findById: vi.fn(),
      saveMany: vi.fn(),
      findActiveHold: vi.fn(),
      findUnavailableSeatIds: vi.fn().mockResolvedValue(['1001']),
      findSeatIdsInScreening: vi.fn().mockResolvedValue(['1001']),
    } satisfies SeatHoldRepositoryPort;
    const cache = {
      hold: vi.fn(),
      release: vi.fn(),
    } satisfies SeatHoldCachePort;
    const lock = {
      acquire: vi
        .fn()
        .mockResolvedValue({ screeningId: '101', seatIds: ['1001'], token: 'lock-token' }),
      release: vi.fn(),
    } satisfies SeatHoldLockPort;
    const handler = new CreateSeatHoldCommandHandler(repository, cache, lock, {
      now: vi.fn(() => now),
    });

    await expect(
      handler.execute(
        CreateSeatHoldCommand.of({
          memberId: '1',
          screeningId: '101',
          seatIds: ['1001'],
        }),
      ),
    ).rejects.toThrow('SEAT_ALREADY_HELD');

    expect(cache.hold).not.toHaveBeenCalled();
    expect(repository.saveMany).not.toHaveBeenCalled();
    expect(lock.release).toHaveBeenCalledWith({
      screeningId: '101',
      seatIds: ['1001'],
      token: 'lock-token',
    });
  });

  it('일부 Redis 임시점유가 실패하면 이미 잡은 Redis 키를 해제한다', async () => {
    const now = new Date('2026-04-29T00:00:00.000Z');
    const repository = {
      save: vi.fn(),
      findById: vi.fn(),
      saveMany: vi.fn(),
      findActiveHold: vi.fn(),
      findUnavailableSeatIds: vi.fn().mockResolvedValue([]),
      findSeatIdsInScreening: vi.fn().mockResolvedValue(['1001', '1002']),
    } satisfies SeatHoldRepositoryPort;
    const cache = {
      hold: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
      release: vi.fn(),
    } satisfies SeatHoldCachePort;
    const lock = {
      acquire: vi
        .fn()
        .mockResolvedValue({ screeningId: '101', seatIds: ['1001', '1002'], token: 'lock-token' }),
      release: vi.fn(),
    } satisfies SeatHoldLockPort;
    const handler = new CreateSeatHoldCommandHandler(repository, cache, lock, {
      now: vi.fn(() => now),
    });

    await expect(
      handler.execute(
        CreateSeatHoldCommand.of({
          memberId: '1',
          screeningId: '101',
          seatIds: ['1001', '1002'],
        }),
      ),
    ).rejects.toThrow('SEAT_ALREADY_HELD');

    expect(cache.release).toHaveBeenCalledWith('101', '1001');
    expect(lock.release).toHaveBeenCalledWith({
      screeningId: '101',
      seatIds: ['1001', '1002'],
      token: 'lock-token',
    });
    expect(repository.saveMany).not.toHaveBeenCalled();
  });

  it('RedLock 획득에 실패하면 기존 점유 확인과 저장을 진행하지 않는다', async () => {
    const now = new Date('2026-04-29T00:00:00.000Z');
    const repository = {
      save: vi.fn(),
      findById: vi.fn(),
      saveMany: vi.fn(),
      findActiveHold: vi.fn(),
      findUnavailableSeatIds: vi.fn(),
      findSeatIdsInScreening: vi.fn(),
    } satisfies SeatHoldRepositoryPort;
    const cache = {
      hold: vi.fn(),
      release: vi.fn(),
    } satisfies SeatHoldCachePort;
    const lock = {
      acquire: vi.fn().mockResolvedValue(undefined),
      release: vi.fn(),
    } satisfies SeatHoldLockPort;
    const handler = new CreateSeatHoldCommandHandler(repository, cache, lock, {
      now: vi.fn(() => now),
    });

    await expect(
      handler.execute(
        CreateSeatHoldCommand.of({
          memberId: '1',
          screeningId: '101',
          seatIds: ['1001'],
        }),
      ),
    ).rejects.toThrow('SEAT_ALREADY_HELD');

    expect(repository.findUnavailableSeatIds).not.toHaveBeenCalled();
    expect(cache.hold).not.toHaveBeenCalled();
    expect(lock.release).not.toHaveBeenCalled();
  });
});

describe('ReleaseSeatHoldCommandHandler', () => {
  it('내가 점유했고 결제 완료되지 않은 좌석 선점을 DB와 Redis에서 해제한다', async () => {
    const createdAt = new Date('2026-04-29T00:00:00.000Z');
    const hold = SeatHoldModel.of({
      screeningId: '101',
      seatId: '1001',
      memberId: '1',
      status: 'HELD',
      expiresAt: new Date('2026-04-29T00:13:00.000Z'),
    }).setPersistence('hold-1', createdAt, createdAt);
    const repository = {
      save: vi.fn(async (model) => model),
      findById: vi.fn().mockResolvedValue(hold),
      saveMany: vi.fn(),
      findActiveHold: vi.fn(),
      findUnavailableSeatIds: vi.fn(),
      findSeatIdsInScreening: vi.fn(),
    } satisfies SeatHoldRepositoryPort;
    const cache = {
      hold: vi.fn(),
      release: vi.fn(),
    } satisfies SeatHoldCachePort;
    const handler = new ReleaseSeatHoldCommandHandler(repository, cache);

    const result = await handler.execute(
      ReleaseSeatHoldCommand.of({ holdId: 'hold-1', memberId: '1' }),
    );

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'RELEASED' }));
    expect(cache.release).toHaveBeenCalledWith('101', '1001');
    expect(result).toEqual({ holdId: 'hold-1', released: true });
  });

  it('다른 회원이 점유한 좌석 선점이면 해제를 거부한다', async () => {
    const createdAt = new Date('2026-04-29T00:00:00.000Z');
    const hold = SeatHoldModel.of({
      screeningId: '101',
      seatId: '1001',
      memberId: '1',
      status: 'HELD',
      expiresAt: new Date('2026-04-29T00:13:00.000Z'),
    }).setPersistence('hold-1', createdAt, createdAt);
    const repository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(hold),
      saveMany: vi.fn(),
      findActiveHold: vi.fn(),
      findUnavailableSeatIds: vi.fn(),
      findSeatIdsInScreening: vi.fn(),
    } satisfies SeatHoldRepositoryPort;
    const cache = {
      hold: vi.fn(),
      release: vi.fn(),
    } satisfies SeatHoldCachePort;
    const handler = new ReleaseSeatHoldCommandHandler(repository, cache);

    await expect(
      handler.execute(ReleaseSeatHoldCommand.of({ holdId: 'hold-1', memberId: '2' })),
    ).rejects.toThrow('SEAT_HOLD_FORBIDDEN');

    expect(repository.save).not.toHaveBeenCalled();
    expect(cache.release).not.toHaveBeenCalled();
  });

  it('결제가 완료되어 예약과 연결된 좌석 선점이면 해제를 거부한다', async () => {
    const createdAt = new Date('2026-04-29T00:00:00.000Z');
    const hold = SeatHoldModel.of({
      screeningId: '101',
      seatId: '1001',
      memberId: '1',
      reservationId: 'reservation-1',
      status: 'CONFIRMED',
      expiresAt: new Date('2026-04-29T00:13:00.000Z'),
    }).setPersistence('hold-1', createdAt, createdAt);
    const repository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(hold),
      saveMany: vi.fn(),
      findActiveHold: vi.fn(),
      findUnavailableSeatIds: vi.fn(),
      findSeatIdsInScreening: vi.fn(),
    } satisfies SeatHoldRepositoryPort;
    const cache = {
      hold: vi.fn(),
      release: vi.fn(),
    } satisfies SeatHoldCachePort;
    const handler = new ReleaseSeatHoldCommandHandler(repository, cache);

    await expect(
      handler.execute(ReleaseSeatHoldCommand.of({ holdId: 'hold-1', memberId: '1' })),
    ).rejects.toThrow('SEAT_HOLD_PAYMENT_COMPLETED');

    expect(repository.save).not.toHaveBeenCalled();
    expect(cache.release).not.toHaveBeenCalled();
  });
});
