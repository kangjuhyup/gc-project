import { Migration } from '@mikro-orm/migrations';

export class Migration202605020002AllowWithdrawnUserIdReuse extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
alter table "member" drop constraint if exists "uq_member_user_id";
alter table "member" drop constraint if exists "uq_member_phone_number";
alter table "member" alter column "phone_number" type varchar(255);
alter table "phone_verification" alter column "phone_number" type varchar(255);
create unique index "uq_member_active_user_id" on "member" ("user_id") where "status" <> 'WITHDRAWN';
create unique index "uq_member_active_phone_number" on "member" ("phone_number") where "status" <> 'WITHDRAWN';
`);
  }
}
