import { describe, expect, it, vi } from 'vitest';
import {
  ConfirmPhoneVerificationCommand,
  RequestPhoneVerificationCommand,
} from '@application/commands/dto';
import {
  ConfirmPhoneVerificationCommandHandler,
  RequestPhoneVerificationCommandHandler,
} from '@application/commands/handlers';
import type {
  ClockPort,
  PhoneVerificationRepositoryPort,
  TransactionManagerPort,
  VerificationCodeGeneratorPort,
} from '@application/commands/ports';
import { PhoneVerificationModel } from '@domain';

const transactionManager = {
  runInTransaction: vi.fn(async (work) => await work()),
} satisfies TransactionManagerPort;

describe('phone verification command handlers', () => {
  it('휴대전화 인증 요청 시 인증 코드를 발급한다', async () => {
    const now = new Date('2026-04-28T00:00:00.000Z');
    const clock = { now: vi.fn(() => now) } satisfies ClockPort;
    const generator = { generate: vi.fn(() => '123456') } satisfies VerificationCodeGeneratorPort;
    const repository = {
      save: vi.fn(async (verification) => verification.setPersistence('verification-1', now, now)),
      findById: vi.fn(),
      findVerifiedByPhoneNumber: vi.fn(),
    } satisfies PhoneVerificationRepositoryPort;
    const handler = new RequestPhoneVerificationCommandHandler(repository, generator, transactionManager, clock);

    const result = await handler.execute(RequestPhoneVerificationCommand.of({ phoneNumber: '01000000000' }));

    expect(repository.save).toHaveBeenCalledOnce();
    expect(result.verificationId).toBe('verification-1');
    expect(result.code).toBe('123456');
    expect(result.expiresAt).toEqual(new Date('2026-04-28T00:05:00.000Z'));
  });

  it('대기 중인 휴대전화 인증을 올바른 코드로 완료한다', async () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const now = new Date('2026-04-28T00:01:00.000Z');
    const clock = { now: vi.fn(() => now) } satisfies ClockPort;
    const verification = PhoneVerificationModel.issue({
      phoneNumber: '01000000000',
      code: '123456',
      expiresAt: new Date('2026-04-28T00:05:00.000Z'),
    }).setPersistence('verification-1', createdAt, createdAt);
    const repository = {
      findById: vi.fn().mockResolvedValue(verification),
      save: vi.fn(),
      findVerifiedByPhoneNumber: vi.fn(),
    } satisfies PhoneVerificationRepositoryPort;
    const handler = new ConfirmPhoneVerificationCommandHandler(repository, transactionManager, clock);

    const result = await handler.execute(
      ConfirmPhoneVerificationCommand.of({
        verificationId: 'verification-1',
        phoneNumber: '01000000000',
        code: '123456',
      }),
    );

    expect(result.verified).toBe(true);
    expect(repository.save).toHaveBeenCalledOnce();
    expect(repository.save.mock.calls[0][0].status).toBe('VERIFIED');
  });
});
