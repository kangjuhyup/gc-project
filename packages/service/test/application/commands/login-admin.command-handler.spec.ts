import { describe, expect, it, vi } from 'vitest';
import { LoginAdminCommand } from '@application/commands/dto';
import { LoginAdminCommandHandler } from '@application/commands/handlers';
import type {
  ClockPort,
  OpaqueTokenGeneratorPort,
  TokenRepositoryPort,
} from '@application/commands/ports';
import { TokenType } from '@application/commands/ports';

const adminOptions = {
  adminId: 'admin',
  password: 'admin-password123!',
  accessTokenTtlSeconds: 900,
};

describe('LoginAdminCommandHandler', () => {
  it('관리자 계정 정보가 일치하면 access token을 저장하고 로그인 결과를 반환한다', async () => {
    const tokenRepository = {
      save: vi.fn(),
      findSubjectId: vi.fn(),
      revokeActiveBySubjectId: vi.fn(),
    } satisfies TokenRepositoryPort;
    const opaqueTokenGenerator = {
      generate: vi.fn(() => 'admin-access-token-0001'),
    } satisfies OpaqueTokenGeneratorPort;
    const clock = {
      now: vi.fn(() => new Date('2026-05-01T00:00:00.000Z')),
    } satisfies ClockPort;
    const handler = new LoginAdminCommandHandler(
      opaqueTokenGenerator,
      tokenRepository,
      clock,
      adminOptions,
    );

    const result = await handler.execute(
      LoginAdminCommand.of({
        userId: 'admin',
        password: 'admin-password123!',
      }),
    );

    expect(result.adminId).toBe('admin');
    expect(result.accessToken).toBe('admin-access-token-0001');
    expect(result.accessTokenExpiresAt).toEqual(new Date('2026-05-01T00:15:00.000Z'));
    expect(tokenRepository.save).toHaveBeenCalledWith({
      type: TokenType.ADMIN_ACCESS,
      subjectId: 'admin',
      token: 'admin-access-token-0001',
      ttlSeconds: 900,
      expiresAt: new Date('2026-05-01T00:15:00.000Z'),
    });
  });

  it('관리자 계정 정보가 일치하지 않으면 access token을 발급하지 않는다', async () => {
    const tokenRepository = {
      save: vi.fn(),
      findSubjectId: vi.fn(),
      revokeActiveBySubjectId: vi.fn(),
    } satisfies TokenRepositoryPort;
    const opaqueTokenGenerator = {
      generate: vi.fn(() => 'admin-access-token-0001'),
    } satisfies OpaqueTokenGeneratorPort;
    const clock = {
      now: vi.fn(() => new Date('2026-05-01T00:00:00.000Z')),
    } satisfies ClockPort;
    const handler = new LoginAdminCommandHandler(
      opaqueTokenGenerator,
      tokenRepository,
      clock,
      adminOptions,
    );

    await expect(
      handler.execute(
        LoginAdminCommand.of({
          userId: 'admin',
          password: 'wrong-password',
        }),
      ),
    ).rejects.toThrow('INVALID_ADMIN_CREDENTIALS');

    expect(opaqueTokenGenerator.generate).not.toHaveBeenCalled();
    expect(tokenRepository.save).not.toHaveBeenCalled();
  });
});
