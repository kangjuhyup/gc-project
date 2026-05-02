import { describe, expect, it, vi } from 'vitest';
import {
  CancelReservationCommand,
  GetMyReservationQuery,
  ListMyReservationsQuery,
} from '@application';
import { AuthenticatedUserDto } from '@application/query/dto';
import { ReservationController } from '@presentation/http';

describe('ReservationController', () => {
  it('인증된 회원의 내 예매 목록 조회를 query bus에 위임한다', async () => {
    const expected = {
      items: [],
      hasNext: false,
    };
    const commandBus = { execute: vi.fn() };
    const queryBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new ReservationController(commandBus as never, queryBus as never);

    const result = await controller.listMine(
      { limit: 10, cursor: 'next-cursor' } as never,
      AuthenticatedUserDto.of({ memberId: '1', userId: 'movie_user' }),
    );

    expect(queryBus.execute).toHaveBeenCalledWith(
      ListMyReservationsQuery.of({
        memberId: '1',
        limit: 10,
        cursor: 'next-cursor',
      }),
    );
    expect(result).toBe(expected);
  });

  it('인증된 회원의 예매 취소 요청을 command bus에 위임한다', async () => {
    const expected = {
      reservationId: '5001',
      paymentId: '7001',
      reservationStatus: 'CANCELED',
      paymentStatus: 'REFUND_REQUIRED',
      reason: 'user request',
    };
    const commandBus = { execute: vi.fn().mockResolvedValue(expected) };
    const queryBus = { execute: vi.fn() };
    const controller = new ReservationController(commandBus as never, queryBus as never);

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

  it('인증된 회원의 내 예매 상세 조회를 query bus에 위임한다', async () => {
    const expected = {
      id: '5001',
      reservationNumber: 'R00000000000005001',
      status: 'CONFIRMED',
    };
    const commandBus = { execute: vi.fn() };
    const queryBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new ReservationController(commandBus as never, queryBus as never);

    const result = await controller.getMine(
      { reservationId: '5001' } as never,
      AuthenticatedUserDto.of({ memberId: '1', userId: 'movie_user' }),
    );

    expect(queryBus.execute).toHaveBeenCalledWith(
      GetMyReservationQuery.of({
        memberId: '1',
        reservationId: '5001',
      }),
    );
    expect(result).toBe(expected);
  });
});
