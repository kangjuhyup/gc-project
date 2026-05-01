import { Migration } from '@mikro-orm/migrations';

export class Migration202605010001CreateAdminAudit extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table "admin_audit" (
        "id" bigserial primary key,
        "admin_id" varchar(50) not null,
        "http_method" varchar(10) not null,
        "path" varchar(300) not null,
        "unmasked_fields" jsonb not null,
        "target_type" varchar(50) not null,
        "target_ids" jsonb not null,
        "reason" varchar(500) not null,
        "occurred_at" timestamptz not null,
        "created_at" timestamptz not null default now()
      );
      create index "idx_admin_audit_admin_occurred" on "admin_audit" ("admin_id", "occurred_at");
      create index "idx_admin_audit_target_occurred" on "admin_audit" ("target_type", "occurred_at");
    `);
  }
}
