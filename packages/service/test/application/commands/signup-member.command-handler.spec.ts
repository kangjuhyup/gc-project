import { describe, expect, it, vi } from 'vitest';
import { PhoneVerificationModel } from '../../../src/domain';
import { SignupMemberCommand } from '../../../src/application/commands/dto';
import { SignupMemberCommandHandler } from '../../../src/application/commands/handlers';
import type {
  MemberRepositoryPort,
  PhoneVerificationRepositoryPort,
} from '../../../src/application/commands/ports';

function command(): SignupMemberCommand {
  return SignupMemberCommand.of({
    userId: 'member_01',
    name: 'Member',
    birthDate: new Date('1990-01-01T00:00:00.000Z'),
    phoneNumber: '01000000000',
    address: 'Seoul',
    phoneVerificationId: 'verification-1',
  });
}

describe('SignupMemberCommandHandler', () => {
  it('rejects duplicated user id', async () => {
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
    const handler = new SignupMemberCommandHandler(memberRepository, phoneVerificationRepository);

    await expect(handler.execute(command())).rejects.toThrow('USER_ID_ALREADY_EXISTS');

    expect(memberRepository.findByPhoneNumber).not.toHaveBeenCalled();
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('rejects duplicated phone number', async () => {
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
    const handler = new SignupMemberCommandHandler(memberRepository, phoneVerificationRepository);

    await expect(handler.execute(command())).rejects.toThrow('PHONE_NUMBER_ALREADY_EXISTS');

    expect(phoneVerificationRepository.findById).not.toHaveBeenCalled();
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('rejects signup without verified phone verification', async () => {
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
    const handler = new SignupMemberCommandHandler(memberRepository, phoneVerificationRepository);

    await expect(handler.execute(command())).rejects.toThrow('PHONE_VERIFICATION_REQUIRED');
  });

  it('saves a member after user id and phone verification checks', async () => {
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
    const handler = new SignupMemberCommandHandler(memberRepository, phoneVerificationRepository);

    const result = await handler.execute(command());

    expect(memberRepository.save).toHaveBeenCalledOnce();
    expect(result.memberId).toBe('member-1');
    expect(result.userId).toBe('member_01');
  });
});
