import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { AdminAuditRepositoryPort, RecordAdminAuditParams } from '@application/commands/ports';
import { AdminAuditEntity } from '../entities';

@Injectable()
@Logging
export class MikroOrmAdminAuditRepository implements AdminAuditRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async record(params: RecordAdminAuditParams): Promise<void> {
    const entity = new AdminAuditEntity();
    entity.adminId = params.adminId;
    entity.httpMethod = params.httpMethod;
    entity.path = params.path;
    entity.unmaskedFields = params.unmaskedFields;
    entity.targetType = params.targetType;
    entity.targetIds = params.targetIds;
    entity.reason = params.reason;
    entity.occurredAt = params.occurredAt;

    await this.entityManager.insert(AdminAuditEntity, entity);
  }
}
