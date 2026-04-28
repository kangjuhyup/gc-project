import { describe, expect, it, vi } from 'vitest';
import { PhoneVerificationModel } from '@domain';
import { SignupMemberCommand } from '@application/commands/dto';
import { SignupMemberCommandHandler } from '@application/commands/handlers';
import type {
  ClockPort,
  LogEventPublisherPort,
  MemberRepositoryPort,
  PhoneVerificationRepositoryPort,
} from '@application/commands/ports';

function command(): SignupMemberCommand {
  return SignupMemberCommand.of({
    userId: 'member_01',
    password: 'password123!',
    name: 'Member',
    birthDate: new Date('1990-01-01T00:00:00.000Z'),
    phoneNumber: '01000000000',
    address: 'Seoul',
    phoneVerificationId: 'verification-1',
  });
}

describe('SignupMemberCommandHandler', () => {
  it('중복된 회원 아이디로 가입하면 거부한다', async () => {
    const memberRepository = {
      existsByUserId: vi.fn().mockResolvedValue(true),
      findByPhoneNumber: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
    } satisfies MemberRepositoryPort;
    const phoneVerificationRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      findVerifiedByPhoneNumber: vi.fn(),
    } satisfies PhoneVerificationRepositoryPort;
    const passwordHasher = { hash: vi.fn().mockResolvedValue('hashed-password'), verify: vi.fn() };
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:02:00.000Z')) } satisfies ClockPort;
    const handler = new SignupMemberCommandHandler(
      memberRepository,
      phoneVerificationRepository,
      passwordHasher,
      logEventPublisher,
      clock,
    );

    await expect(handler.execute(command())).rejects.toThrow('USER_ID_ALREADY_EXISTS');

    expect(memberRepository.findByPhoneNumber).not.toHaveBeenCalled();
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('중복된 휴대전화번호로 가입하면 거부한다', async () => {
    const memberRepository = {
      existsByUserId: vi.fn().mockResolvedValue(false),
      findByPhoneNumber: vi.fn().mockResolvedValue({}),
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
    } satisfies MemberRepositoryPort;
    const phoneVerificationRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      findVerifiedByPhoneNumber: vi.fn(),
    } satisfies PhoneVerificationRepositoryPort;
    const passwordHasher = { hash: vi.fn().mockResolvedValue('hashed-password'), verify: vi.fn() };
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:02:00.000Z')) } satisfies ClockPort;
    const handler = new SignupMemberCommandHandler(
      memberRepository,
      phoneVerificationRepository,
      passwordHasher,
      logEventPublisher,
      clock,
    );

    await expect(handler.execute(command())).rejects.toThrow('PHONE_NUMBER_ALREADY_EXISTS');

    expect(phoneVerificationRepository.findById).not.toHaveBeenCalled();
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('인증 완료된 휴대전화 인증이 없으면 회원가입을 거부한다', async () => {
    const memberRepository = {
      existsByUserId: vi.fn().mockResolvedValue(false),
      findByPhoneNumber: vi.fn().mockResolvedValue(undefined),
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
    } satisfies MemberRepositoryPort;
    const phoneVerificationRepository = {
      findById: vi.fn().mockResolvedValue(undefined),
      save: vi.fn(),
      findVerifiedByPhoneNumber: vi.fn(),
    } satisfies PhoneVerificationRepositoryPort;
    const passwordHasher = { hash: vi.fn().mockResolvedValue('hashed-password'), verify: vi.fn() };
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:02:00.000Z')) } satisfies ClockPort;
    const handler = new SignupMemberCommandHandler(
      memberRepository,
      phoneVerificationRepository,
      passwordHasher,
      logEventPublisher,
      clock,
    );

    await expect(handler.execute(command())).rejects.toThrow('PHONE_VERIFICATION_REQUIRED');
  });

  it('회원 아이디와 휴대전화 인증 검증을 통과하면 회원을 저장한다', async () => {
    const verifiedAt = new Date('2026-04-28T00:01:00.000Z');
    const verification = PhoneVerificationModel.of({
      phoneNumber: '01000000000',
      code: '123456',
      status: 'VERIFIED',
      expiresAt: new Date('2026-04-28T00:05:00.000Z'),
      verifiedAt,
    }).setPersistence('verification-1', new Date('2026-04-28T00:00:00.000Z'), verifiedAt);
    const memberRepository = {
      existsByUserId: vi.fn().mockResolvedValue(false),
      findByPhoneNumber: vi.fn().mockResolvedValue(undefined),
      save: vi.fn(async (member) => member.setPersistence('member-1', new Date(), new Date())),
      findById: vi.fn(),
      findByUserId: vi.fn(),
    } satisfies MemberRepositoryPort;
    const phoneVerificationRepository = {
      findById: vi.fn().mockResolvedValue(verification),
      save: vi.fn(),
      findVerifiedByPhoneNumber: vi.fn(),
    } satisfies PhoneVerificationRepositoryPort;
    const passwordHasher = { hash: vi.fn().mockResolvedValue('hashed-password'), verify: vi.fn() };
    const logEventPublisher = { publish: vi.fn() } satisfies LogEventPublisherPort;
    const clock = { now: vi.fn(() => new Date('2026-04-28T00:02:00.000Z')) } satisfies ClockPort;
    const handler = new SignupMemberCommandHandler(
      memberRepository,
      phoneVerificationRepository,
      passwordHasher,
      logEventPublisher,
      clock,
    );

    const result = await handler.execute(command());

    expect(memberRepository.save).toHaveBeenCalledOnce();
    expect(passwordHasher.hash).toHaveBeenCalledWith('password123!');
    expect(logEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        userId: 'member_01',
        occurredAt: new Date('2026-04-28T00:02:00.000Z'),
      }),
    );
    expect(result.memberId).toBe('member-1');
    expect(result.userId).toBe('member_01');
  });
});
