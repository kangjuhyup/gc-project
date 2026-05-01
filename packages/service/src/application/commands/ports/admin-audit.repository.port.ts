export const ADMIN_AUDIT_REPOSITORY = Symbol('ADMIN_AUDIT_REPOSITORY');

export interface RecordAdminAuditParams {
  adminId: string;
  httpMethod: string;
  path: string;
  unmaskedFields: string[];
  targetType: string;
  targetIds: string[];
  reason: string;
  occurredAt: Date;
}

export interface AdminAuditRepositoryPort {
  record(params: RecordAdminAuditParams): Promise<void>;
}
