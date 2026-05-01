import type { RecordAdminAuditCommand } from '../dto';
import type { AdminAuditRepositoryPort } from '../ports';

export class RecordAdminAuditCommandHandler {
  constructor(private readonly adminAuditRepository: AdminAuditRepositoryPort) {}

  async execute(command: RecordAdminAuditCommand): Promise<void> {
    await this.adminAuditRepository.record({
      adminId: command.adminId,
      httpMethod: command.httpMethod,
      path: command.path,
      unmaskedFields: command.unmaskedFields,
      targetType: command.targetType,
      targetIds: command.targetIds,
      reason: command.reason,
      occurredAt: command.occurredAt,
    });
  }
}
