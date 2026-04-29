import { describe, expect, it, vi } from 'vitest';
import { CreateSeatHoldCommand, ReleaseSeatHoldCommand } from '@application/commands/dto';
import { AuthenticatedUserDto } from '@application/query/dto';
import { ListScreeningSeatsQuery } from '@application/query/dto';
import { SeatController } from '@presentation/http';

describe('SeatController', () => {
  it('상영 좌석 목록 조회 요청을 query bus에 위임한다', async () => {
    const expected = {
      screeningId: '101',
      seats: [],
    };
    const queryBus = { execute: vi.fn().mockResolvedValue(expected) };
    const commandBus = { execute: vi.fn() };
    const controller = new SeatController(queryBus as never, commandBus as never);

    const result = await controller.list({ screeningId: '101' } as never);

    expect(queryBus.execute).toHaveBeenCalledWith(
      ListScreeningSeatsQuery.of({ screeningId: '101' }),
    );
    expect(result).toBe(expected);
  });

  it('인증된 회원의 좌석 임시점유 요청을 command bus에 위임한다', async () => {
    const expected = {
      screeningId: '101',
      seatIds: ['1001'],
      holdIds: ['9001'],
      ttlSeconds: 600,
      expiresAt: new Date('2026-04-29T00:10:00.000Z'),
    };
    const queryBus = { execute: vi.fn() };
    const commandBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new SeatController(queryBus as never, commandBus as never);

    const result = await controller.createHold(
      {
        screeningId: '101',
        seatIds: ['1001'],
      } as never,
      AuthenticatedUserDto.of({ memberId: '1', userId: 'movie_user' }),
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      CreateSeatHoldCommand.of({
        memberId: '1',
        screeningId: '101',
        seatIds: ['1001'],
      }),
    );
    expect(result).toBe(expected);
  });

  it('인증된 회원의 좌석 임시점유 해제 요청을 command bus에 위임한다', async () => {
    const expected = {
      holdId: '9001',
      released: true,
    };
    const queryBus = { execute: vi.fn() };
    const commandBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new SeatController(queryBus as never, commandBus as never);

    const result = await controller.releaseHold(
      { holdId: '9001' } as never,
      AuthenticatedUserDto.of({ memberId: '1', userId: 'movie_user' }),
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      ReleaseSeatHoldCommand.of({
        holdId: '9001',
        memberId: '1',
      }),
    );
    expect(result).toBe(expected);
  });
});
