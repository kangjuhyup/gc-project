import { describe, expect, it, vi } from 'vitest';
import { MemberModel, PhoneVerificationModel } from '@domain';
import {
  ChangeMemberPasswordCommand,
  IssueTemporaryPasswordCommand,
  LoginMemberCommand,
} from '@application/commands/dto';
import {
  ChangeMemberPasswordCommandHandler,
  IssueTemporaryPasswordCommandHandler,
  LoginMemberCommandHandler,
} from '@application/commands/handlers';
import type {
  ClockPort,
  LogEventPublisherPort,
  MemberRepositoryPort,
  PasswordHasherPort,
  PhoneVerificationRepositoryPort,
  TemporaryPasswordGeneratorPort,
} from '@application/commands/ports';

function activeMember(failedLoginCount = 0): MemberModel {
  const createdAt = new Date('2026-04-28T00:00:00.000Z');
  return MemberModel.of({
    userId: 'member_01',
    passwordHash: 'hashed-password',
    name: 'Member',
    birthDate: new Date('1990-01-01T00:00:00.000Z'),
    phoneNumber: '01000000000',
    address: 'Seoul',
    status: 'ACTIVE',
    failedLoginCount,
  }).setPersistence('member-1', createdAt, createdAt);
}

describe('LoginMemberCommandHandler', () => {
  it('비밀번호가 일치하면 로그인 성공 결과를 반환한다', async () => {
    const memberRepository = {
      findByUserId: vi.fn().mockResolvedValue(activeMember()),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const passwordHasher = {
      verify: vi.fn().mockResolvedValue(true),
      hash: vi.fn(),
    } satisfies PasswordHasherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:01:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const handler = new LoginMemberCommandHandler(memberRepository, passwordHasher, clock, logEventPublisher);

    const result = await handler.execute(LoginMemberCommand.of({ userId: 'member_01', password: 'password123!' }));

    expect(result.memberId).toBe('member-1');
    expect(result.userId).toBe('member_01');
    expect(memberRepository.save).not.toHaveBeenCalled();
    expect(logEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        userId: 'member_01',
        occurredAt: new Date('2026-04-28T00:01:00.000Z'),
      }),
    );
  });

  it('비밀번호가 틀리면 실패 횟수를 저장하고 로그인을 거부한다', async () => {
    const memberRepository = {
      findByUserId: vi.fn().mockResolvedValue(activeMember()),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(async (member) => member),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const passwordHasher = {
      verify: vi.fn().mockResolvedValue(false),
      hash: vi.fn(),
    } satisfies PasswordHasherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:01:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const handler = new LoginMemberCommandHandler(memberRepository, passwordHasher, clock, logEventPublisher);

    await expect(
      handler.execute(LoginMemberCommand.of({ userId: 'member_01', password: 'wrong-password' })),
    ).rejects.toThrow('INVALID_LOGIN_CREDENTIALS');

    expect(memberRepository.save).toHaveBeenCalledOnce();
    expect(memberRepository.save.mock.calls[0][0].failedLoginCount).toBe(1);
    expect(logEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'member_01',
        failedLoginCount: 1,
        locked: false,
        occurredAt: new Date('2026-04-28T00:01:00.000Z'),
      }),
    );
  });

  it('비밀번호 실패가 5회째이면 회원을 LOCKED 상태로 저장한다', async () => {
    const memberRepository = {
      findByUserId: vi.fn().mockResolvedValue(activeMember(4)),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(async (member) => member),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const passwordHasher = {
      verify: vi.fn().mockResolvedValue(false),
      hash: vi.fn(),
    } satisfies PasswordHasherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:01:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const handler = new LoginMemberCommandHandler(memberRepository, passwordHasher, clock, logEventPublisher);

    await expect(
      handler.execute(LoginMemberCommand.of({ userId: 'member_01', password: 'wrong-password' })),
    ).rejects.toThrow('INVALID_LOGIN_CREDENTIALS');

    expect(memberRepository.save.mock.calls[0][0].status).toBe('LOCKED');
    expect(memberRepository.save.mock.calls[0][0].failedLoginCount).toBe(5);
    expect(logEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'member_01',
        failedLoginCount: 5,
        locked: true,
      }),
    );
  });

  it('잠긴 회원이면 비밀번호 검증 전에 로그인을 거부한다', async () => {
    const lockedMember = activeMember(5).recordLoginFailure(new Date('2026-04-28T00:01:00.000Z'));
    const memberRepository = {
      findByUserId: vi.fn().mockResolvedValue(lockedMember),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const passwordHasher = {
      verify: vi.fn(),
      hash: vi.fn(),
    } satisfies PasswordHasherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:01:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const handler = new LoginMemberCommandHandler(memberRepository, passwordHasher, clock, logEventPublisher);

    await expect(
      handler.execute(LoginMemberCommand.of({ userId: 'member_01', password: 'password123!' })),
    ).rejects.toThrow('MEMBER_LOCKED');

    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });
});

describe('IssueTemporaryPasswordCommandHandler', () => {
  it('휴대전화 인증이 완료되면 임시비밀번호를 발급하고 회원 잠금을 해제한다', async () => {
    const member = activeMember(5).recordLoginFailure(new Date('2026-04-28T00:01:00.000Z'));
    const verification = PhoneVerificationModel.of({
      phoneNumber: '01000000000',
      code: '123456',
      status: 'VERIFIED',
      expiresAt: new Date('2026-04-28T00:05:00.000Z'),
      verifiedAt: new Date('2026-04-28T00:02:00.000Z'),
    }).setPersistence(
      'verification-1',
      new Date('2026-04-28T00:00:00.000Z'),
      new Date('2026-04-28T00:02:00.000Z'),
    );
    const memberRepository = {
      findByUserId: vi.fn().mockResolvedValue(member),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(async (saved) => saved),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const phoneVerificationRepository = {
      findById: vi.fn().mockResolvedValue(verification),
      save: vi.fn(),
      findVerifiedByPhoneNumber: vi.fn(),
    } satisfies PhoneVerificationRepositoryPort;
    const temporaryPasswordGenerator = {
      generate: vi.fn(() => 'Temp-abc1231!'),
    } satisfies TemporaryPasswordGeneratorPort;
    const passwordHasher = {
      hash: vi.fn().mockResolvedValue('temporary-hash'),
      verify: vi.fn(),
    } satisfies PasswordHasherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:03:00.000Z')) } satisfies ClockPort;
    const handler = new IssueTemporaryPasswordCommandHandler(
      memberRepository,
      phoneVerificationRepository,
      temporaryPasswordGenerator,
      passwordHasher,
      clock,
    );

    const result = await handler.execute(
      IssueTemporaryPasswordCommand.of({ userId: 'member_01', phoneVerificationId: 'verification-1' }),
    );

    expect(result.temporaryPassword).toBe('Temp-abc1231!');
    expect(memberRepository.save.mock.calls[0][0].passwordHash).toBe('temporary-hash');
    expect(memberRepository.save.mock.calls[0][0].status).toBe('ACTIVE');
    expect(memberRepository.save.mock.calls[0][0].failedLoginCount).toBe(0);
  });
});

describe('ChangeMemberPasswordCommandHandler', () => {
  it('기존 비밀번호 검증이 통과하면 신규 비밀번호로 변경한다', async () => {
    const memberRepository = {
      findByUserId: vi.fn().mockResolvedValue(activeMember()),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(async (saved) => saved),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const passwordHasher = {
      verify: vi.fn().mockResolvedValue(true),
      hash: vi.fn().mockResolvedValue('new-password-hash'),
    } satisfies PasswordHasherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:04:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const handler = new ChangeMemberPasswordCommandHandler(memberRepository, passwordHasher, clock, logEventPublisher);

    const result = await handler.execute(
      ChangeMemberPasswordCommand.of({
        userId: 'member_01',
        currentPassword: 'password123!',
        newPassword: 'newPassword123!',
      }),
    );

    expect(passwordHasher.verify).toHaveBeenCalledWith({
      password: 'password123!',
      passwordHash: 'hashed-password',
    });
    expect(passwordHasher.hash).toHaveBeenCalledWith('newPassword123!');
    expect(memberRepository.save.mock.calls[0][0].passwordHash).toBe('new-password-hash');
    expect(logEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        userId: 'member_01',
        occurredAt: new Date('2026-04-28T00:04:00.000Z'),
      }),
    );
    expect(result).toEqual({ userId: 'member_01', changed: true });
  });

  it('기존 비밀번호 검증이 실패하면 비밀번호를 변경하지 않는다', async () => {
    const memberRepository = {
      findByUserId: vi.fn().mockResolvedValue(activeMember()),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const passwordHasher = {
      verify: vi.fn().mockResolvedValue(false),
      hash: vi.fn(),
    } satisfies PasswordHasherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:04:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const handler = new ChangeMemberPasswordCommandHandler(memberRepository, passwordHasher, clock, logEventPublisher);

    await expect(
      handler.execute(
        ChangeMemberPasswordCommand.of({
          userId: 'member_01',
          currentPassword: 'wrong-password',
          newPassword: 'newPassword123!',
        }),
      ),
    ).rejects.toThrow('CURRENT_PASSWORD_MISMATCH');

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(memberRepository.save).not.toHaveBeenCalled();
    expect(logEventPublisher.publish).not.toHaveBeenCalled();
  });
});
