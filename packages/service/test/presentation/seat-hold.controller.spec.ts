import { describe, expect, it, vi } from 'vitest';
import { CreateSeatHoldCommand } from '@application/commands/dto';
import { AuthenticatedUserDto } from '@application/query/dto';
import { SeatHoldController } from '@presentation/http';

describe('SeatHoldController', () => {
  it('인증된 회원의 좌석 임시점유 요청을 command handler에 위임한다', async () => {
    const expected = {
      screeningId: '101',
      seatIds: ['1001'],
      holdIds: ['9001'],
      ttlSeconds: 600,
      expiresAt: new Date('2026-04-29T00:10:00.000Z'),
    };
    const commandHandler = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new SeatHoldController(commandHandler as never);

    const result = await controller.create(
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
