import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'admin_audit' })
@Index({ name: 'idx_admin_audit_admin_occurred', properties: ['adminId', 'occurredAt'] })
@Index({ name: 'idx_admin_audit_target_occurred', properties: ['targetType', 'occurredAt'] })
export class AdminAuditEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property({ length: 50 })
  adminId!: string;

  @Property({ length: 10 })
  httpMethod!: string;

  @Property({ length: 300 })
  path!: string;

  @Property({ columnType: 'jsonb' })
  unmaskedFields!: string[];

  @Property({ length: 50 })
  targetType!: string;

  @Property({ columnType: 'jsonb' })
  targetIds!: string[];

  @Property({ length: 500 })
  reason!: string;

  @Property({ columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();
}
