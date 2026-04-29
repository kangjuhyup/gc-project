import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AuthenticatedUserDto } from '@application/query/dto';
import { getAuthenticatedUser } from '@presentation';
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
