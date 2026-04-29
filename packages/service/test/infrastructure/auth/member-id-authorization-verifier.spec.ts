import { describe, expect, it, vi } from 'vitest';
import { MemberIdAuthorizationVerifier } from '@infrastructure/auth';

describe('MemberIdAuthorizationVerifier', () => {
  it('Bearer 토큰의 회원 ID로 인증 사용자를 조회한다', async () => {
    const memberRepository = {
      findById: vi.fn().mockResolvedValue({
        id: '1',
        userId: 'movie_user',
      }),
    };
    const verifier = new MemberIdAuthorizationVerifier(memberRepository as never);

    const result = await verifier.verify('Bearer 1');

    expect(memberRepository.findById).toHaveBeenCalledWith('1');
    expect(result.memberId).toBe('1');
    expect(result.userId).toBe('movie_user');
  });

  it('회원을 찾을 수 없으면 Authorization 검증 실패로 처리한다', async () => {
    const memberRepository = {
      findById: vi.fn().mockResolvedValue(undefined),
    };
    const verifier = new MemberIdAuthorizationVerifier(memberRepository as never);

    await expect(verifier.verify('Bearer 999')).rejects.toThrow('AUTHORIZATION_INVALID');
  });
});
