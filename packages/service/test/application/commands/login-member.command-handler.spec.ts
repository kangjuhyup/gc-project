import { describe, expect, it, vi } from 'vitest';
import { MemberModel, PhoneVerificationModel, RefreshTokenModel } from '@domain';
import {
  ChangeMemberPasswordCommand,
  IssueTemporaryPasswordCommand,
  LoginMemberCommand,
  LogoutMemberCommand,
  RefreshMemberTokenCommand,
  WithdrawMemberCommand,
} from '@application/commands/dto';
import {
  ChangeMemberPasswordCommandHandler,
  IssueTemporaryPasswordCommandHandler,
  LoginMemberCommandHandler,
  LogoutMemberCommandHandler,
  RefreshMemberTokenCommandHandler,
  WithdrawMemberCommandHandler,
} from '@application/commands/handlers';
import type {
  ClockPort,
  LogEventPublisherPort,
  MemberRepositoryPort,
  OpaqueTokenGeneratorPort,
  PasswordHasherPort,
  PhoneVerificationRepositoryPort,
  ReservationRepositoryPort,
  TemporaryPasswordGeneratorPort,
  TokenRepositoryPort,
} from '@application/commands/ports';
import { TokenType } from '@application/commands/ports';

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

function tokenRepository(): TokenRepositoryPort {
  return {
    save: vi.fn(),
    findSubjectId: vi.fn(),
    findRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeActiveBySubjectId: vi.fn(async (params) => (params.type === TokenType.REFRESH ? 1 : 1)),
  };
}

function reservationRepository(hasIncompleteReservation = false): ReservationRepositoryPort {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByReservationNumber: vi.fn(),
    findByIdForUpdate: vi.fn(),
    hasIncompleteReservationByMemberId: vi.fn(async () => hasIncompleteReservation),
  };
}

function opaqueTokenGenerator(): OpaqueTokenGeneratorPort {
  return {
    generate: vi
      .fn()
      .mockReturnValueOnce('access-token-0001')
      .mockReturnValueOnce('refresh-token-0001'),
  };
}

const loginTokenTtlOptions = {
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlSeconds: 14 * 24 * 60 * 60,
};

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
    const tokens = tokenRepository();
    const handler = new LoginMemberCommandHandler(
      memberRepository,
      passwordHasher,
      clock,
      logEventPublisher,
      opaqueTokenGenerator(),
      tokens,
      loginTokenTtlOptions,
    );

    const result = await handler.execute(
      LoginMemberCommand.of({ userId: 'member_01', password: 'password123!' }),
    );

    expect(result.memberId).toBe('member-1');
    expect(result.userId).toBe('member_01');
    expect(result.accessToken).toBe('access-token-0001');
    expect(result.accessTokenExpiresAt).toEqual(new Date('2026-04-28T00:16:00.000Z'));
    expect(result.refreshToken).toBe('refresh-token-0001');
    expect(result.refreshTokenExpiresAt).toEqual(new Date('2026-05-12T00:01:00.000Z'));
    expect(tokens.save).toHaveBeenCalledWith({
      type: TokenType.ACCESS,
      subjectId: 'member-1',
      token: 'access-token-0001',
      ttlSeconds: 15 * 60,
      expiresAt: new Date('2026-04-28T00:16:00.000Z'),
    });
    expect(tokens.save).toHaveBeenCalledWith({
      type: TokenType.REFRESH,
      subjectId: 'member-1',
      token: 'refresh-token-0001',
      ttlSeconds: 14 * 24 * 60 * 60,
      expiresAt: new Date('2026-05-12T00:01:00.000Z'),
    });
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
    const handler = new LoginMemberCommandHandler(
      memberRepository,
      passwordHasher,
      clock,
      logEventPublisher,
      opaqueTokenGenerator(),
      tokenRepository(),
      loginTokenTtlOptions,
    );

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
    const handler = new LoginMemberCommandHandler(
      memberRepository,
      passwordHasher,
      clock,
      logEventPublisher,
      opaqueTokenGenerator(),
      tokenRepository(),
      loginTokenTtlOptions,
    );

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
    const handler = new LoginMemberCommandHandler(
      memberRepository,
      passwordHasher,
      clock,
      logEventPublisher,
      opaqueTokenGenerator(),
      tokenRepository(),
      loginTokenTtlOptions,
    );

    await expect(
      handler.execute(LoginMemberCommand.of({ userId: 'member_01', password: 'password123!' })),
    ).rejects.toThrow('MEMBER_LOCKED');

    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  it('탈퇴한 회원이면 비밀번호 검증 전에 로그인을 거부한다', async () => {
    const withdrawnMember = activeMember().withdraw(new Date('2026-04-28T00:01:00.000Z'));
    const memberRepository = {
      findByUserId: vi.fn().mockResolvedValue(withdrawnMember),
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
    const handler = new LoginMemberCommandHandler(
      memberRepository,
      passwordHasher,
      clock,
      logEventPublisher,
      opaqueTokenGenerator(),
      tokenRepository(),
      loginTokenTtlOptions,
    );

    await expect(
      handler.execute(LoginMemberCommand.of({ userId: 'member_01', password: 'password123!' })),
    ).rejects.toThrow('MEMBER_WITHDRAWN');

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
      IssueTemporaryPasswordCommand.of({
        userId: 'member_01',
        phoneVerificationId: 'verification-1',
      }),
    );

    expect(result.temporaryPassword).toBe('Temp-abc1231!');
    expect(memberRepository.save.mock.calls[0][0].passwordHash).toBe('temporary-hash');
    expect(memberRepository.save.mock.calls[0][0].status).toBe('ACTIVE');
    expect(memberRepository.save.mock.calls[0][0].failedLoginCount).toBe(0);
  });
});

describe('LogoutMemberCommandHandler', () => {
  it('로그아웃하면 회원의 활성 refresh token을 모두 폐기한다', async () => {
    const tokens = tokenRepository();
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:06:00.000Z')) } satisfies ClockPort;
    const handler = new LogoutMemberCommandHandler(tokens, clock);

    const result = await handler.execute(LogoutMemberCommand.of({ memberId: 'member-1' }));

    expect(tokens.revokeActiveBySubjectId).toHaveBeenCalledWith({
      type: TokenType.ACCESS,
      subjectId: 'member-1',
      now: new Date('2026-04-28T00:06:00.000Z'),
    });
    expect(tokens.revokeActiveBySubjectId).toHaveBeenCalledWith({
      type: TokenType.REFRESH,
      subjectId: 'member-1',
      now: new Date('2026-04-28T00:06:00.000Z'),
    });
    expect(result).toEqual({
      memberId: 'member-1',
      loggedOut: true,
      revokedRefreshTokenCount: 1,
    });
  });
});

describe('RefreshMemberTokenCommandHandler', () => {
  it('유효한 refresh token이면 기존 토큰을 폐기하고 새 토큰 쌍을 발급한다', async () => {
    const member = activeMember();
    const refreshToken = RefreshTokenModel.issue({
      memberId: 'member-1',
      token: 'old-refresh-token',
      expiresAt: new Date('2026-05-12T00:01:00.000Z'),
    }).setPersistence(
      'refresh-token-1',
      new Date('2026-04-28T00:01:00.000Z'),
      new Date('2026-04-28T00:01:00.000Z'),
    );
    const memberRepository = {
      findByUserId: vi.fn(),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(member),
    } satisfies MemberRepositoryPort;
    const tokens = tokenRepository();
    vi.mocked(tokens.findRefreshToken).mockResolvedValue(refreshToken);
    const generator = {
      generate: vi
        .fn()
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token'),
    } satisfies OpaqueTokenGeneratorPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:06:00.000Z')) } satisfies ClockPort;
    const handler = new RefreshMemberTokenCommandHandler(
      memberRepository,
      generator,
      tokens,
      clock,
      loginTokenTtlOptions,
    );

    const result = await handler.execute(
      RefreshMemberTokenCommand.of({ refreshToken: 'old-refresh-token' }),
    );

    expect(tokens.findRefreshToken).toHaveBeenCalledWith('old-refresh-token');
    expect(memberRepository.findById).toHaveBeenCalledWith('member-1');
    expect(tokens.revokeRefreshToken).toHaveBeenCalledWith(
      refreshToken,
      new Date('2026-04-28T00:06:00.000Z'),
    );
    expect(tokens.save).toHaveBeenCalledWith({
      type: TokenType.ACCESS,
      subjectId: 'member-1',
      token: 'new-access-token',
      ttlSeconds: 15 * 60,
      expiresAt: new Date('2026-04-28T00:21:00.000Z'),
    });
    expect(tokens.save).toHaveBeenCalledWith({
      type: TokenType.REFRESH,
      subjectId: 'member-1',
      token: 'new-refresh-token',
      ttlSeconds: 14 * 24 * 60 * 60,
      expiresAt: new Date('2026-05-12T00:06:00.000Z'),
    });
    expect(result).toEqual({
      memberId: 'member-1',
      userId: 'member_01',
      accessToken: 'new-access-token',
      accessTokenExpiresAt: new Date('2026-04-28T00:21:00.000Z'),
      refreshToken: 'new-refresh-token',
      refreshTokenExpiresAt: new Date('2026-05-12T00:06:00.000Z'),
    });
  });

  it('refresh token이 없으면 토큰을 재발급하지 않는다', async () => {
    const memberRepository = {
      findByUserId: vi.fn(),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const tokens = tokenRepository();
    vi.mocked(tokens.findRefreshToken).mockResolvedValue(undefined);
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:06:00.000Z')) } satisfies ClockPort;
    const handler = new RefreshMemberTokenCommandHandler(
      memberRepository,
      opaqueTokenGenerator(),
      tokens,
      clock,
      loginTokenTtlOptions,
    );

    await expect(
      handler.execute(RefreshMemberTokenCommand.of({ refreshToken: 'missing-refresh-token' })),
    ).rejects.toThrow('INVALID_REFRESH_TOKEN');

    expect(memberRepository.findById).not.toHaveBeenCalled();
    expect(tokens.save).not.toHaveBeenCalled();
  });

  it('만료된 refresh token이면 토큰을 재발급하지 않는다', async () => {
    const refreshToken = RefreshTokenModel.issue({
      memberId: 'member-1',
      token: 'expired-refresh-token',
      expiresAt: new Date('2026-04-28T00:05:59.000Z'),
    }).setPersistence(
      'refresh-token-1',
      new Date('2026-04-28T00:01:00.000Z'),
      new Date('2026-04-28T00:01:00.000Z'),
    );
    const memberRepository = {
      findByUserId: vi.fn(),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
    } satisfies MemberRepositoryPort;
    const tokens = tokenRepository();
    vi.mocked(tokens.findRefreshToken).mockResolvedValue(refreshToken);
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:06:00.000Z')) } satisfies ClockPort;
    const handler = new RefreshMemberTokenCommandHandler(
      memberRepository,
      opaqueTokenGenerator(),
      tokens,
      clock,
      loginTokenTtlOptions,
    );

    await expect(
      handler.execute(RefreshMemberTokenCommand.of({ refreshToken: 'expired-refresh-token' })),
    ).rejects.toThrow('REFRESH_TOKEN_EXPIRED');

    expect(memberRepository.findById).not.toHaveBeenCalled();
    expect(tokens.save).not.toHaveBeenCalled();
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
    const handler = new ChangeMemberPasswordCommandHandler(
      memberRepository,
      passwordHasher,
      clock,
      logEventPublisher,
    );

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
    const handler = new ChangeMemberPasswordCommandHandler(
      memberRepository,
      passwordHasher,
      clock,
      logEventPublisher,
    );

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

describe('WithdrawMemberCommandHandler', () => {
  it('회원을 탈퇴 상태로 저장하고 탈퇴 결과를 반환한다', async () => {
    const memberRepository = {
      findById: vi.fn().mockResolvedValue(activeMember()),
      findByUserId: vi.fn(),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(async (saved) => saved),
    } satisfies MemberRepositoryPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:05:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const tokens = tokenRepository();
    const reservations = reservationRepository();
    const handler = new WithdrawMemberCommandHandler(
      memberRepository,
      reservations,
      tokens,
      clock,
      logEventPublisher,
    );

    const result = await handler.execute(WithdrawMemberCommand.of({ memberId: 'member-1' }));

    expect(memberRepository.findById).toHaveBeenCalledWith('member-1');
    expect(reservations.hasIncompleteReservationByMemberId).toHaveBeenCalledWith({
      memberId: 'member-1',
      now: new Date('2026-04-28T00:05:00.000Z'),
    });
    expect(memberRepository.save.mock.calls[0][0].status).toBe('WITHDRAWN');
    expect(tokens.revokeActiveBySubjectId).toHaveBeenCalledWith({
      type: TokenType.ACCESS,
      subjectId: 'member-1',
      now: new Date('2026-04-28T00:05:00.000Z'),
    });
    expect(tokens.revokeActiveBySubjectId).toHaveBeenCalledWith({
      type: TokenType.REFRESH,
      subjectId: 'member-1',
      now: new Date('2026-04-28T00:05:00.000Z'),
    });
    expect(logEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        userId: 'member_01',
        occurredAt: new Date('2026-04-28T00:05:00.000Z'),
      }),
    );
    expect(result).toEqual({ memberId: 'member-1', userId: 'member_01', withdrawn: true });
  });

  it('존재하지 않는 회원을 탈퇴하려고 하면 저장하지 않는다', async () => {
    const memberRepository = {
      findById: vi.fn().mockResolvedValue(undefined),
      findByUserId: vi.fn(),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(),
    } satisfies MemberRepositoryPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:05:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const tokens = tokenRepository();
    const reservations = reservationRepository();
    const handler = new WithdrawMemberCommandHandler(
      memberRepository,
      reservations,
      tokens,
      clock,
      logEventPublisher,
    );

    await expect(
      handler.execute(WithdrawMemberCommand.of({ memberId: 'missing-member' })),
    ).rejects.toThrow('MEMBER_NOT_FOUND');

    expect(memberRepository.save).not.toHaveBeenCalled();
    expect(reservations.hasIncompleteReservationByMemberId).not.toHaveBeenCalled();
    expect(tokens.revokeActiveBySubjectId).not.toHaveBeenCalled();
    expect(logEventPublisher.publish).not.toHaveBeenCalled();
  });

  it('관람 완료되지 않은 예매가 있으면 회원탈퇴를 거부한다', async () => {
    const memberRepository = {
      findById: vi.fn().mockResolvedValue(activeMember()),
      findByUserId: vi.fn(),
      findByPhoneNumber: vi.fn(),
      existsByUserId: vi.fn(),
      save: vi.fn(),
    } satisfies MemberRepositoryPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:05:00.000Z')) } satisfies ClockPort;
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const tokens = tokenRepository();
    const reservations = reservationRepository(true);
    const handler = new WithdrawMemberCommandHandler(
      memberRepository,
      reservations,
      tokens,
      clock,
      logEventPublisher,
    );

    await expect(
      handler.execute(WithdrawMemberCommand.of({ memberId: 'member-1' })),
    ).rejects.toThrow('MEMBER_HAS_INCOMPLETE_RESERVATION');

    expect(reservations.hasIncompleteReservationByMemberId).toHaveBeenCalledWith({
      memberId: 'member-1',
      now: new Date('2026-04-28T00:05:00.000Z'),
    });
    expect(memberRepository.save).not.toHaveBeenCalled();
    expect(tokens.revokeActiveBySubjectId).not.toHaveBeenCalled();
    expect(logEventPublisher.publish).not.toHaveBeenCalled();
  });
});
