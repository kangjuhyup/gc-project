import { describe, expect, it, vi } from 'vitest';
import { TokenType } from '@application/commands/ports';
import { MemberIdAuthorizationVerifier } from '@infrastructure/auth';

describe('MemberIdAuthorizationVerifier', () => {
  it('Bearer access token을 Redis에서 조회한 회원 ID로 인증 사용자를 만든다', async () => {
    const tokenRepository = {
      findMemberId: vi.fn().mockResolvedValue('1'),
    };
    const memberRepository = {
      findById: vi.fn().mockResolvedValue({
        id: '1',
        userId: 'movie_user',
        status: 'ACTIVE',
      }),
    };
    const verifier = new MemberIdAuthorizationVerifier(memberRepository as never, tokenRepository as never);

    const result = await verifier.verify('Bearer access-token-0001');

    expect(tokenRepository.findMemberId).toHaveBeenCalledWith({
      type: TokenType.ACCESS,
      token: 'access-token-0001',
    });
    expect(memberRepository.findById).toHaveBeenCalledWith('1');
    expect(result.memberId).toBe('1');
    expect(result.userId).toBe('movie_user');
  });

  it('Redis에서 access token을 찾을 수 없으면 Authorization 검증 실패로 처리한다', async () => {
    const tokenRepository = {
      findMemberId: vi.fn().mockResolvedValue(undefined),
    };
    const memberRepository = {
      findById: vi.fn(),
    };
    const verifier = new MemberIdAuthorizationVerifier(memberRepository as never, tokenRepository as never);

    await expect(verifier.verify('Bearer missing-token')).rejects.toThrow('AUTHORIZATION_INVALID');
    expect(memberRepository.findById).not.toHaveBeenCalled();
  });

  it('탈퇴한 회원이면 Authorization 검증 실패로 처리한다', async () => {
    const tokenRepository = {
      findMemberId: vi.fn().mockResolvedValue('1'),
    };
    const memberRepository = {
      findById: vi.fn().mockResolvedValue({
        id: '1',
        userId: 'movie_user',
        status: 'WITHDRAWN',
      }),
    };
    const verifier = new MemberIdAuthorizationVerifier(memberRepository as never, tokenRepository as never);

    await expect(verifier.verify('Bearer access-token-0001')).rejects.toThrow('AUTHORIZATION_INVALID');
  });
});
