import { describe, expect, it, vi } from 'vitest';
import { AuthenticatedAdminDto } from '@application/query/dto';
import { AdminController } from '@presentation/http';

describe('AdminController', () => {
  it('관리자 로그인 요청을 command bus에 위임한다', async () => {
    const commandBus = {
      execute: vi.fn().mockResolvedValue({
        adminId: 'admin',
        accessToken: 'admin-access-token',
      }),
    };
    const controller = new AdminController(commandBus as never);

    const result = await controller.login({
      userId: 'admin',
      password: 'admin-password123!',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual({
      adminId: 'admin',
      accessToken: 'admin-access-token',
    });
  });

  it('관리자 인증 확인 요청에서 인증된 관리자 정보를 반환한다', () => {
    const commandBus = { execute: vi.fn() };
    const controller = new AdminController(commandBus as never);

    const result = controller.me(AuthenticatedAdminDto.of({ adminId: 'admin' }));

    expect(result.adminId).toBe('admin');
  });
});
