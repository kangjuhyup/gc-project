import { describe, expect, it, vi } from 'vitest';
import { CancelReservationCommand } from '@application';
import { AuthenticatedUserDto } from '@application/query/dto';
import { ReservationController } from '@presentation/http';

describe('ReservationController', () => {
  it('인증된 회원의 예매 취소 요청을 command bus에 위임한다', async () => {
    const expected = {
      reservationId: '5001',
      paymentId: '7001',
      reservationStatus: 'CANCELED',
      paymentStatus: 'REFUND_REQUIRED',
      reason: 'user request',
    };
    const commandBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new ReservationController(commandBus as never);

    const result = await controller.cancel(
      { reservationId: '5001' } as never,
      { reason: 'user request' } as never,
      AuthenticatedUserDto.of({ memberId: '1', userId: 'movie_user' }),
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      CancelReservationCommand.of({
        memberId: '1',
        reservationId: '5001',
        reason: 'user request',
      }),
    );
    expect(result).toBe(expected);
  });
});
