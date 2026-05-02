import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { lastValueFrom, of } from 'rxjs';
import { AdminMemberListResultDto, AdminMemberSummaryDto } from '@application/query/dto';
import { AdminPiiMaskInterceptor } from '@presentation/interceptor';

function context(headers: Record<string, string> = {}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        admin: { adminId: 'admin' },
        headers,
        method: 'GET',
        originalUrl: '/admin/members?currentPage=1',
        route: { path: '/admin/members' },
      }),
    }),
  };
}

function next(response: unknown) {
  return {
    handle: () => of(response),
  };
}

function memberList() {
  return AdminMemberListResultDto.of({
    totalCount: 1,
    currentPage: 1,
    countPerPage: 20,
    items: [
      AdminMemberSummaryDto.of({
        id: '1',
        userId: 'member_01',
        name: '홍길동',
        phoneNumber: '01000000001',
        status: 'ACTIVE',
        failedLoginCount: 0,
        createdAt: '2026-05-01T00:00:00.000Z',
      }),
    ],
  });
}

describe('AdminPiiMaskInterceptor', () => {
  it('관리자 회원 목록의 @Privacy 필드를 기본 마스킹한다', async () => {
    const commandBus = { execute: vi.fn() };
    const interceptor = new AdminPiiMaskInterceptor(commandBus as never);

    const result = await lastValueFrom(
      interceptor.intercept(context() as never, next(memberList()) as never),
    );

    expect(result).toMatchObject({
      items: [
        {
          name: '홍*동',
          phoneNumber: '010****0001',
        },
      ],
      privacy: {
        masked: true,
        fields: ['name', 'phoneNumber'],
      },
    });
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('해제 헤더와 사유가 있으면 원문을 반환하고 audit command를 실행한다', async () => {
    const commandBus = { execute: vi.fn() };
    const interceptor = new AdminPiiMaskInterceptor(commandBus as never);

    const result = await lastValueFrom(
      interceptor.intercept(
        context({
          'x-admin-unmask-pii': 'true',
          'x-admin-unmask-reason': '고객 응대',
        }) as never,
        next(memberList()) as never,
      ),
    );

    expect(result).toMatchObject({
      items: [
        {
          name: '홍길동',
          phoneNumber: '01000000001',
        },
      ],
      privacy: {
        masked: false,
        fields: ['name', 'phoneNumber'],
      },
    });
    expect(commandBus.execute).toHaveBeenCalledOnce();
  });

  it('해제 헤더가 있지만 사유가 없으면 bad request로 거부한다', async () => {
    const commandBus = { execute: vi.fn() };
    const interceptor = new AdminPiiMaskInterceptor(commandBus as never);

    expect(() =>
      interceptor.intercept(
        context({ 'x-admin-unmask-pii': 'true' }) as never,
        next(memberList()) as never,
      ),
    ).toThrow(BadRequestException);
  });
});
