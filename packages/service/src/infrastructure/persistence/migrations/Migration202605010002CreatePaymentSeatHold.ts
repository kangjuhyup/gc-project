import { Migration } from '@mikro-orm/migrations';

export class Migration202605010002CreatePaymentSeatHold extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
create table "payment_seat_hold" ("id" bigserial primary key, "payment_id" bigint not null, "seat_hold_id" bigint not null);
create index "idx_payment_seat_hold_payment" on "payment_seat_hold" ("payment_id");
create index "idx_payment_seat_hold_seat_hold" on "payment_seat_hold" ("seat_hold_id");
alter table "payment_seat_hold" add constraint "uq_payment_seat_hold_payment_hold" unique ("payment_id", "seat_hold_id");
alter table "payment_seat_hold" add constraint "payment_seat_hold_payment_id_foreign" foreign key ("payment_id") references "payment" ("id") on update cascade on delete cascade;
alter table "payment_seat_hold" add constraint "payment_seat_hold_seat_hold_id_foreign" foreign key ("seat_hold_id") references "seat_hold" ("id") on update cascade;

insert into "payment_seat_hold" ("payment_id", "seat_hold_id")
select "id", "seat_hold_id"
from "payment"
where not exists (
  select 1
  from "payment_seat_hold"
  where "payment_seat_hold"."payment_id" = "payment"."id"
    and "payment_seat_hold"."seat_hold_id" = "payment"."seat_hold_id"
);
`);
  }
}
