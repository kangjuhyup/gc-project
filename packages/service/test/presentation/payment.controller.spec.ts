import { describe, expect, it, vi } from 'vitest';
import {
  GetPaymentQuery,
  HandlePaymentCallbackCommand,
  RefundPaymentCommand,
  RequestPaymentCommand,
} from '@application';
import { AuthenticatedUserDto } from '@application/query/dto';
import { PaymentController } from '@presentation/http';

describe('PaymentController', () => {
  it('인증된 회원의 결제 요청을 command bus에 위임한다', async () => {
    const expected = {
      paymentId: '7001',
      seatHoldId: '9001',
      idempotencyKey: 'pay-test-key',
      provider: 'LOCAL',
      status: 'PENDING',
      amount: 15000,
    };
    const queryBus = { execute: vi.fn() };
    const commandBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new PaymentController(queryBus as never, commandBus as never);

    const result = await controller.request(
      {
        seatHoldId: '9001',
        idempotencyKey: 'pay-test-key',
        provider: 'LOCAL',
        amount: 15000,
      } as never,
      AuthenticatedUserDto.of({ memberId: '1', userId: 'movie_user' }),
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      RequestPaymentCommand.of({
        memberId: '1',
        seatHoldId: '9001',
        idempotencyKey: 'pay-test-key',
        provider: 'LOCAL',
        amount: 15000,
      }),
    );
    expect(result).toBe(expected);
  });

  it('인증된 회원의 결제 상세 조회를 query bus에 위임한다', async () => {
    const expected = {
      paymentId: '7001',
      seatHoldId: '9001',
      idempotencyKey: 'pay-test-key',
      provider: 'LOCAL',
      status: 'APPROVED',
      amount: 15000,
    };
    const queryBus = { execute: vi.fn().mockResolvedValue(expected) };
    const commandBus = { execute: vi.fn() };
    const controller = new PaymentController(queryBus as never, commandBus as never);

    const result = await controller.get(
      { paymentId: '7001' } as never,
      AuthenticatedUserDto.of({ memberId: '1', userId: 'movie_user' }),
    );

    expect(queryBus.execute).toHaveBeenCalledWith(
      GetPaymentQuery.of({
        paymentId: '7001',
        memberId: '1',
      }),
    );
    expect(result).toBe(expected);
  });

  it('결제 provider callback 요청을 command bus에 위임한다', async () => {
    const expected = {
      paymentId: '7001',
      handled: true,
    };
    const queryBus = { execute: vi.fn() };
    const commandBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new PaymentController(queryBus as never, commandBus as never);

    const result = await controller.callback({
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-7001',
      paymentId: '7001',
      amount: 15000,
      approved: true,
      token: 'local:7001:local-payment-7001',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      HandlePaymentCallbackCommand.of({
        provider: 'LOCAL',
        providerPaymentId: 'local-payment-7001',
        paymentId: '7001',
        amount: 15000,
        approved: true,
        token: 'local:7001:local-payment-7001',
      }),
    );
    expect(result).toBe(expected);
  });

  it('결제 환불 요청을 command bus에 위임한다', async () => {
    const expected = {
      paymentId: '7001',
      status: 'REFUNDED',
    };
    const queryBus = { execute: vi.fn() };
    const commandBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new PaymentController(queryBus as never, commandBus as never);

    const result = await controller.refund({ paymentId: '7001' } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(RefundPaymentCommand.of({ paymentId: '7001' }));
    expect(result).toBe(expected);
  });
});
