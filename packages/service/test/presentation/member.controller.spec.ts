import { describe, expect, it, vi } from 'vitest';
import { MemberController } from '@presentation/http';

describe('MemberController', () => {
  it('회원 아이디 중복검사를 query bus에 위임한다', async () => {
    const queryBus = { execute: vi.fn().mockResolvedValue({ available: true }) };
    const commandBus = { execute: vi.fn() };
    const controller = new MemberController(queryBus as never, commandBus as never);

    const result = await controller.checkUserId({ userId: 'member_01' } as never);

    expect(queryBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ available: true });
  });

  it('회원가입 요청을 command bus에 위임한다', async () => {
    const queryBus = { execute: vi.fn() };
    const commandBus = { execute: vi.fn().mockResolvedValue({ memberId: '1', userId: 'member_01' }) };
    const controller = new MemberController(queryBus as never, commandBus as never);

    const result = await controller.signup({
      userId: 'member_01',
      password: 'password123!',
      name: 'Member',
      birthDate: '1990-01-01',
      phoneNumber: '01000000000',
      address: 'Seoul',
      phoneVerificationId: 'verification-1',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ memberId: '1', userId: 'member_01' });
  });

  it('로그인 요청을 command bus에 위임한다', async () => {
    const queryBus = { execute: vi.fn() };
    const commandBus = { execute: vi.fn().mockResolvedValue({ memberId: '1', userId: 'member_01' }) };
    const controller = new MemberController(queryBus as never, commandBus as never);

    const result = await controller.login({
      userId: 'member_01',
      password: 'password123!',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ memberId: '1', userId: 'member_01' });
  });

  it('refresh token 재발급 요청을 command bus에 위임한다', async () => {
    const queryBus = { execute: vi.fn() };
    const commandBus = { execute: vi.fn().mockResolvedValue({ memberId: '1', accessToken: 'new-access-token' }) };
    const controller = new MemberController(queryBus as never, commandBus as never);

    const result = await controller.refreshToken({
      refreshToken: 'refresh-token-0001',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ memberId: '1', accessToken: 'new-access-token' });
  });

  it('임시비밀번호 발급 요청을 command bus에 위임한다', async () => {
    const queryBus = { execute: vi.fn() };
    const commandBus = {
      execute: vi.fn().mockResolvedValue({ userId: 'member_01', temporaryPassword: 'Temp-abc1231!' }),
    };
    const controller = new MemberController(queryBus as never, commandBus as never);

    const result = await controller.issueTemporaryPassword({
      userId: 'member_01',
      phoneVerificationId: 'verification-1',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ userId: 'member_01', temporaryPassword: 'Temp-abc1231!' });
  });

  it('비밀번호 변경 요청을 command bus에 위임한다', async () => {
    const queryBus = { execute: vi.fn() };
    const commandBus = {
      execute: vi.fn().mockResolvedValue({ userId: 'member_01', changed: true }),
    };
    const controller = new MemberController(queryBus as never, commandBus as never);

    const result = await controller.changePassword({
      userId: 'member_01',
      currentPassword: 'password123!',
      newPassword: 'newPassword123!',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({ userId: 'member_01', changed: true });
  });
});
