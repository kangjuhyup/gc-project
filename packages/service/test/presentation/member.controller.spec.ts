import { describe, expect, it, vi } from 'vitest';
import { MemberController } from '@presentation/http';

describe('MemberController', () => {
  it('회원 아이디 중복검사를 query handler에 위임한다', async () => {
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

  it('회원가입 요청을 command handler에 위임한다', async () => {
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
