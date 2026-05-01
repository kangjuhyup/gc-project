import { describe, expect, it, vi } from 'vitest';
import { TokenType } from '@application/commands/ports';
import { AdminAuthorizationVerifier } from '@infrastructure/auth';

describe('AdminAuthorizationVerifier', () => {
  it('Bearer access token을 Redis에서 조회한 관리자 ID로 인증 관리자를 만든다', async () => {
    const tokenRepository = {
      findSubjectId: vi.fn().mockResolvedValue('admin'),
    };
    const verifier = new AdminAuthorizationVerifier(tokenRepository as never);

    const result = await verifier.verify('Bearer admin-access-token-0001');

    expect(tokenRepository.findSubjectId).toHaveBeenCalledWith({
      type: TokenType.ADMIN_ACCESS,
      token: 'admin-access-token-0001',
    });
    expect(result.adminId).toBe('admin');
  });

  it('Redis에서 관리자 access token을 찾을 수 없으면 Authorization 검증 실패로 처리한다', async () => {
    const tokenRepository = {
      findSubjectId: vi.fn().mockResolvedValue(undefined),
    };
    const verifier = new AdminAuthorizationVerifier(tokenRepository as never);

    await expect(verifier.verify('Bearer missing-token')).rejects.toThrow('AUTHORIZATION_INVALID');
  });
});
