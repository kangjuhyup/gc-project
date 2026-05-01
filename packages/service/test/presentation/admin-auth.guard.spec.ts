import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticatedAdminDto } from '@application/query/dto';
import { AdminAuthGuard, type HttpRequestWithAuthenticatedAdmin } from '@presentation/guard';
import { getAuthenticatedAdmin } from '@presentation';

function contextWithAuthorization(authorization?: string | string[]): {
  context: ExecutionContext;
  request: HttpRequestWithAuthenticatedAdmin;
} {
  const request: HttpRequestWithAuthenticatedAdmin = {
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

describe('AdminAuthGuard', () => {
  it('Authorization 헤더가 유효하면 인증된 관리자 정보를 request에 저장한다', async () => {
    const admin = AuthenticatedAdminDto.of({ adminId: 'admin' });
    const verifier = { verify: vi.fn().mockResolvedValue(admin) };
    const guard = new AdminAuthGuard(verifier as never);
    const { context, request } = contextWithAuthorization('Bearer admin-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(verifier.verify).toHaveBeenCalledWith('Bearer admin-token');
    expect(request.admin).toBe(admin);
  });

  it('Authorization 헤더가 없으면 인증 필수 예외를 던진다', async () => {
    const verifier = { verify: vi.fn() };
    const guard = new AdminAuthGuard(verifier as never);
    const { context } = contextWithAuthorization();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('Authorization 검증에 실패하면 인증 실패 예외를 던진다', async () => {
    const verifier = { verify: vi.fn().mockRejectedValue(new Error('AUTHORIZATION_INVALID')) };
    const guard = new AdminAuthGuard(verifier as never);
    const { context } = contextWithAuthorization('Bearer wrong-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('Admin decorator helper', () => {
  it('인증된 관리자 전체 정보를 request에서 꺼낸다', () => {
    const admin = AuthenticatedAdminDto.of({ adminId: 'admin' });
    const { context, request } = contextWithAuthorization('Bearer access-token');
    request.admin = admin;

    expect(getAuthenticatedAdmin(context)).toBe(admin);
  });

  it('인증된 관리자 정보 중 지정한 필드만 request에서 꺼낸다', () => {
    const { context, request } = contextWithAuthorization('Bearer access-token');
    request.admin = AuthenticatedAdminDto.of({ adminId: 'admin' });

    expect(getAuthenticatedAdmin(context, 'adminId')).toBe('admin');
  });
});
