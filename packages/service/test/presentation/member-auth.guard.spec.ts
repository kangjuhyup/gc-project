import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticatedUserDto } from '@application/query/dto';
import type { AuthorizationVerifierPort } from '@application/query/ports';
import { getAuthenticatedUser, MemberAuthGuard } from '@presentation';
import type { HttpRequestWithAuthenticatedUser } from '@presentation/guard/member-auth.guard';

function contextWithAuthorization(authorization?: string | string[]): {
  context: ExecutionContext;
  request: HttpRequestWithAuthenticatedUser;
} {
  const request: HttpRequestWithAuthenticatedUser = {
    headers: {
      authorization,
    },
  };
  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext,
  };
}

describe('MemberAuthGuard', () => {
  it('Authorization 검증이 성공하면 회원 전용 엔드포인트 접근을 허용한다', async () => {
    const user = AuthenticatedUserDto.of({ memberId: 'member-1', userId: 'member_01' });
    const authorizationVerifier = {
      verify: vi.fn().mockResolvedValue(user),
    } satisfies AuthorizationVerifierPort;
    const guard = new MemberAuthGuard(authorizationVerifier);
    const { context, request } = contextWithAuthorization('Bearer access-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(authorizationVerifier.verify).toHaveBeenCalledWith('Bearer access-token');
    expect(request.user).toBe(user);
  });

  it('Authorization 헤더가 없으면 회원 전용 엔드포인트 접근을 거부한다', async () => {
    const authorizationVerifier = {
      verify: vi.fn(),
    } satisfies AuthorizationVerifierPort;
    const guard = new MemberAuthGuard(authorizationVerifier);
    const { context } = contextWithAuthorization();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authorizationVerifier.verify).not.toHaveBeenCalled();
  });

  it('Authorization 검증이 실패하면 회원 전용 엔드포인트 접근을 거부한다', async () => {
    const authorizationVerifier = {
      verify: vi.fn().mockRejectedValue(new Error('INVALID_TOKEN')),
    } satisfies AuthorizationVerifierPort;
    const guard = new MemberAuthGuard(authorizationVerifier);
    const { context } = contextWithAuthorization('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('User decorator helper', () => {
  it('인증된 사용자 전체 정보를 request에서 꺼낸다', () => {
    const user = AuthenticatedUserDto.of({ memberId: 'member-1', userId: 'member_01' });
    const { context, request } = contextWithAuthorization('Bearer access-token');
    request.user = user;

    expect(getAuthenticatedUser(context)).toBe(user);
  });

  it('인증된 사용자 정보 중 지정한 필드만 request에서 꺼낸다', () => {
    const { context, request } = contextWithAuthorization('Bearer access-token');
    request.user = AuthenticatedUserDto.of({ memberId: 'member-1', userId: 'member_01' });

    expect(getAuthenticatedUser(context, 'memberId')).toBe('member-1');
  });
});
