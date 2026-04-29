import { describe, expect, it, vi } from 'vitest';
import { CreateSeatHoldCommand } from '@application/commands/dto';
import { AuthenticatedUserDto } from '@application/query/dto';
import { ListScreeningSeatsQuery } from '@application/query/dto';
import { SeatController } from '@presentation/http';

describe('SeatController', () => {
  it('상영 좌석 목록 조회 요청을 query handler에 위임한다', async () => {
    const expected = {
      screeningId: '101',
      seats: [],
    };
    const queryHandler = { execute: vi.fn().mockResolvedValue(expected) };
    const commandHandler = { execute: vi.fn() };
    const controller = new SeatController(queryHandler as never, commandHandler as never);

    const result = await controller.list({ screeningId: '101' } as never);

    expect(queryHandler.execute).toHaveBeenCalledWith(
      ListScreeningSeatsQuery.of({ screeningId: '101' }),
    );
    expect(result).toBe(expected);
  });

  it('인증된 회원의 좌석 임시점유 요청을 command handler에 위임한다', async () => {
    const expected = {
      screeningId: '101',
      seatIds: ['1001'],
      holdIds: ['9001'],
      ttlSeconds: 600,
      expiresAt: new Date('2026-04-29T00:10:00.000Z'),
    };
    const queryHandler = { execute: vi.fn() };
    const commandHandler = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new SeatController(queryHandler as never, commandHandler as never);

    const result = await controller.createHold(
      {
        screeningId: '101',
        seatIds: ['1001'],
      } as never,
      AuthenticatedUserDto.of({ memberId: '1', userId: 'movie_user' }),
    );

    expect(commandHandler.execute).toHaveBeenCalledWith(
      CreateSeatHoldCommand.of({
        memberId: '1',
        screeningId: '101',
        seatIds: ['1001'],
      }),
    );
    expect(result).toBe(expected);
  });
});
