import { describe, expect, it, vi } from 'vitest';
import { MemberController } from '../../src/presentation/http';

describe('MemberController', () => {
  it('delegates user id availability check to query handler', async () => {
    const queryHandler = { execute: vi.fn().mockResolvedValue({ available: true }) };
    const controller = new MemberController(
      queryHandler as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
    );

    const result = await controller.checkUserId({ userId: 'member_01' } as never);

    expect(queryHandler.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ available: true });
  });

  it('delegates signup to command handler', async () => {
    const signupHandler = { execute: vi.fn().mockResolvedValue({ memberId: '1', userId: 'member_01' }) };
    const controller = new MemberController(
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      signupHandler as never,
    );

    const result = await controller.signup({
      userId: 'member_01',
      name: 'Member',
      birthDate: '1990-01-01',
      phoneNumber: '01000000000',
      address: 'Seoul',
      phoneVerificationId: 'verification-1',
    } as never);

    expect(signupHandler.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ memberId: '1', userId: 'member_01' });
  });
});
