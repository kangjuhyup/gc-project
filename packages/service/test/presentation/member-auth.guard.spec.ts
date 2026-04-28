import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthorizationVerifierPort } from '@application/query/ports';
import { MemberAuthGuard } from '@presentation';

function contextWithAuthorization(authorization?: string | string[]): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization,
        },
      }),
    }),
  } as ExecutionContext;
}

describe('MemberAuthGuard', () => {
  it('Authorization 검증이 성공하면 회원 전용 엔드포인트 접근을 허용한다', async () => {
    const authorizationVerifier = {
      verify: vi.fn().mockResolvedValue(undefined),
    } satisfies AuthorizationVerifierPort;
    const guard = new MemberAuthGuard(authorizationVerifier);

    await expect(guard.canActivate(contextWithAuthorization('Bearer access-token'))).resolves.toBe(true);

    expect(authorizationVerifier.verify).toHaveBeenCalledWith('Bearer access-token');
  });

  it('Authorization 헤더가 없으면 회원 전용 엔드포인트 접근을 거부한다', async () => {
    const authorizationVerifier = {
      verify: vi.fn(),
    } satisfies AuthorizationVerifierPort;
    const guard = new MemberAuthGuard(authorizationVerifier);

    await expect(guard.canActivate(contextWithAuthorization())).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authorizationVerifier.verify).not.toHaveBeenCalled();
  });

  it('Authorization 검증이 실패하면 회원 전용 엔드포인트 접근을 거부한다', async () => {
    const authorizationVerifier = {
      verify: vi.fn().mockRejectedValue(new Error('INVALID_TOKEN')),
    } satisfies AuthorizationVerifierPort;
    const guard = new MemberAuthGuard(authorizationVerifier);

    await expect(guard.canActivate(contextWithAuthorization('Bearer invalid-token'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
