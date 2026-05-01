export class RecordAdminAuditCommand {
  readonly adminId: string;
  readonly httpMethod: string;
  readonly path: string;
  readonly unmaskedFields: string[];
  readonly targetType: string;
  readonly targetIds: string[];
  readonly reason: string;
  readonly occurredAt: Date;

  private constructor(params: {
    adminId: string;
    httpMethod: string;
    path: string;
    unmaskedFields: string[];
    targetType: string;
    targetIds: string[];
    reason: string;
    occurredAt: Date;
  }) {
    this.adminId = params.adminId;
    this.httpMethod = params.httpMethod;
    this.path = params.path;
    this.unmaskedFields = params.unmaskedFields;
    this.targetType = params.targetType;
    this.targetIds = params.targetIds;
    this.reason = params.reason;
    this.occurredAt = params.occurredAt;
  }

  static of(params: {
    adminId: string;
    httpMethod: string;
    path: string;
    unmaskedFields: string[];
    targetType: string;
    targetIds: string[];
    reason: string;
    occurredAt: Date;
  }): RecordAdminAuditCommand {
    return new RecordAdminAuditCommand(params);
  }
}
