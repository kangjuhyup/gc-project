import { describe, expect, it, vi } from 'vitest';
import { RecordAdminAuditCommand } from '@application/commands/dto';
import { RecordAdminAuditCommandHandler } from '@application/commands/handlers';
import type { AdminAuditRepositoryPort } from '@application/commands/ports';

describe('RecordAdminAuditCommandHandler', () => {
  it('관리자 개인정보 마스킹 해제 기록을 audit repository에 저장한다', async () => {
    const repository = {
      record: vi.fn(),
    } satisfies AdminAuditRepositoryPort;
    const handler = new RecordAdminAuditCommandHandler(repository);
    const occurredAt = new Date('2026-05-01T00:00:00.000Z');

    await handler.execute(
      RecordAdminAuditCommand.of({
        adminId: 'admin',
        httpMethod: 'GET',
        path: '/admin/members',
        unmaskedFields: ['name', 'phoneNumber'],
        targetType: 'MEMBER',
        targetIds: ['1'],
        reason: '고객 응대',
        occurredAt,
      }),
    );

    expect(repository.record).toHaveBeenCalledWith({
      adminId: 'admin',
      httpMethod: 'GET',
      path: '/admin/members',
      unmaskedFields: ['name', 'phoneNumber'],
      targetType: 'MEMBER',
      targetIds: ['1'],
      reason: '고객 응대',
      occurredAt,
    });
  });
});
