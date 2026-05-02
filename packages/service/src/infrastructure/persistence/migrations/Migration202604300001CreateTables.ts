import { Migration } from '@mikro-orm/migrations';

export class Migration202604300001CreateTables extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
set names 'utf8';

create table "member" ("id" bigserial primary key, "user_id" varchar(30) not null, "password_hash" varchar(255) not null, "name" varchar(50) not null, "birth_date" date not null, "phone_number" varchar(255) not null, "address" varchar(255) not null, "status" varchar(20) not null, "failed_login_count" int not null default 0, "locked_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());
create unique index "uq_member_active_user_id" on "member" ("user_id") where "status" <> 'WITHDRAWN';
create unique index "uq_member_active_phone_number" on "member" ("phone_number") where "status" <> 'WITHDRAWN';

create table "movie" ("id" bigserial primary key, "title" varchar(200) not null, "director" varchar(100) null, "genre" varchar(50) null, "running_time" int not null, "rating" varchar(20) null, "release_date" date null, "poster_url" varchar(500) null, "description" text null, "created_at" timestamptz not null default now());

create table "movie_image" ("id" bigserial primary key, "movie_id" bigint not null, "image_type" varchar(20) not null, "url" varchar(500) not null, "sort_order" int not null default 0, "created_at" timestamptz not null default now());
create index "idx_movie_image_movie_type_order" on "movie_image" ("movie_id", "image_type", "sort_order");

create table "outbox_event" ("id" bigserial primary key, "aggregate_type" varchar(50) not null, "aggregate_id" varchar(50) not null, "event_type" varchar(80) not null, "payload" jsonb not null, "status" varchar(20) not null, "retry_count" int not null, "next_retry_at" timestamptz null, "locked_until" timestamptz null, "last_error" varchar(500) null, "occurred_at" timestamptz not null, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());
create index "idx_outbox_aggregate" on "outbox_event" ("aggregate_type", "aggregate_id");
create index "idx_outbox_publishable" on "outbox_event" ("status", "next_retry_at", "occurred_at");

create table "phone_verification" ("id" bigserial primary key, "phone_number" varchar(255) not null, "code" varchar(6) not null, "status" varchar(20) not null, "expires_at" timestamptz not null, "verified_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());
create index "idx_phone_verification_phone_status" on "phone_verification" ("phone_number", "status");

create table "member_refresh_token" ("id" bigserial primary key, "member_id" bigint not null, "token" varchar(100) not null, "expires_at" timestamptz not null, "revoked_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());
alter table "member_refresh_token" add constraint "uq_member_refresh_token_token" unique ("token");

create table "theater" ("id" bigserial primary key, "name" varchar(100) not null, "address" varchar(255) not null, "latitude" double precision null, "longitude" double precision null, "created_at" timestamptz not null default now());
alter table "theater" add constraint "uq_theater_name" unique ("name");

create table "screen" ("id" bigserial primary key, "theater_id" bigint not null, "name" varchar(50) not null, "total_seats" int not null);
alter table "screen" add constraint "uq_screen_theater_name" unique ("theater_id", "name");

create table "seat" ("id" bigserial primary key, "screen_id" bigint not null, "seat_row" varchar(5) not null, "seat_col" int not null, "seat_type" varchar(20) null);
alter table "seat" add constraint "uq_seat_screen_row_col" unique ("screen_id", "seat_row", "seat_col");

create table "screening" ("id" bigserial primary key, "movie_id" bigint not null, "screen_id" bigint not null, "start_at" timestamptz not null, "end_at" timestamptz not null, "price" int not null);
alter table "screening" add constraint "chk_screening_time_range" check ("end_at" > "start_at");
alter table "screening" add constraint "uq_screening_screen_start" unique ("screen_id", "start_at");
create index "idx_screening_movie_start" on "screening" ("movie_id", "start_at");
create index "idx_screening_screen_start" on "screening" ("screen_id", "start_at");

create table "reservation" ("id" bigserial primary key, "reservation_number" varchar(20) not null, "member_id" bigint not null, "screening_id" bigint not null, "status" varchar(20) not null, "total_price" int not null, "canceled_at" timestamptz null, "cancel_reason" varchar(100) null, "created_at" timestamptz not null default now());
create index "idx_reservation_member_status" on "reservation" ("member_id", "status", "created_at");
create index "idx_reservation_member_created" on "reservation" ("member_id", "created_at");
alter table "reservation" add constraint "uq_reservation_number" unique ("reservation_number");

create table "seat_hold" ("id" bigserial primary key, "screening_id" bigint not null, "seat_id" bigint not null, "member_id" bigint not null, "reservation_id" bigint null, "status" varchar(20) not null, "expires_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());
create index "idx_hold_expires_active" on "seat_hold" ("expires_at", "status");
create index "idx_hold_screening_active" on "seat_hold" ("screening_id", "status");
create index "idx_hold_member_status" on "seat_hold" ("member_id", "status", "created_at");

create table "reservation_seat" ("id" bigserial primary key, "reservation_id" bigint not null, "screening_id" bigint not null, "seat_id" bigint not null);
alter table "reservation_seat" add constraint "uq_reservation_seat_screening_seat" unique ("screening_id", "seat_id");

create table "reservation_event" ("id" bigserial primary key, "reservation_id" bigint not null, "event_type" varchar(30) not null, "description" varchar(255) null, "created_at" timestamptz not null default now());
create index "idx_reservation_event" on "reservation_event" ("reservation_id", "created_at");

create table "payment" ("id" bigserial primary key, "member_id" bigint not null, "seat_hold_id" bigint not null, "idempotency_key" varchar(100) not null, "request_hash" varchar(64) not null, "reservation_id" bigint null, "provider" varchar(20) not null, "provider_payment_id" varchar(100) null, "amount" int not null, "status" varchar(30) not null, "requested_at" timestamptz not null, "approved_at" timestamptz null, "failed_at" timestamptz null, "refunded_at" timestamptz null, "failure_reason" varchar(255) null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());
create index "idx_payment_seat_hold" on "payment" ("seat_hold_id");
create index "idx_payment_member_created" on "payment" ("member_id", "created_at");
alter table "payment" add constraint "uq_payment_provider_payment_id" unique ("provider", "provider_payment_id");
alter table "payment" add constraint "uq_payment_member_idempotency_key" unique ("member_id", "idempotency_key");

create table "payment_seat_hold" ("id" bigserial primary key, "payment_id" bigint not null, "seat_hold_id" bigint not null);
create index "idx_payment_seat_hold_payment" on "payment_seat_hold" ("payment_id");
create index "idx_payment_seat_hold_seat_hold" on "payment_seat_hold" ("seat_hold_id");
alter table "payment_seat_hold" add constraint "uq_payment_seat_hold_payment_hold" unique ("payment_id", "seat_hold_id");

create table "payment_event_log" ("id" bigserial primary key, "payment_id" bigint not null, "event_type" varchar(50) not null, "previous_status" varchar(30) null, "next_status" varchar(30) not null, "provider" varchar(20) not null, "provider_payment_id" varchar(100) null, "amount" int not null, "reason" varchar(255) null, "metadata" jsonb null, "occurred_at" timestamptz not null, "created_at" timestamptz not null default now());
create index "idx_payment_event_log_payment_created" on "payment_event_log" ("payment_id", "created_at");

create table "admin_audit" ("id" bigserial primary key, "admin_id" varchar(50) not null, "http_method" varchar(10) not null, "path" varchar(300) not null, "unmasked_fields" jsonb not null, "target_type" varchar(50) not null, "target_ids" jsonb not null, "reason" varchar(500) not null, "occurred_at" timestamptz not null, "created_at" timestamptz not null default now());
create index "idx_admin_audit_admin_occurred" on "admin_audit" ("admin_id", "occurred_at");
create index "idx_admin_audit_target_occurred" on "admin_audit" ("target_type", "occurred_at");

alter table "movie_image" add constraint "movie_image_movie_id_foreign" foreign key ("movie_id") references "movie" ("id") on update cascade;

alter table "member_refresh_token" add constraint "member_refresh_token_member_id_foreign" foreign key ("member_id") references "member" ("id") on update cascade;

alter table "screen" add constraint "screen_theater_id_foreign" foreign key ("theater_id") references "theater" ("id") on update cascade;

alter table "seat" add constraint "seat_screen_id_foreign" foreign key ("screen_id") references "screen" ("id") on update cascade;

alter table "screening" add constraint "screening_movie_id_foreign" foreign key ("movie_id") references "movie" ("id") on update cascade;
alter table "screening" add constraint "screening_screen_id_foreign" foreign key ("screen_id") references "screen" ("id") on update cascade;

alter table "reservation" add constraint "reservation_member_id_foreign" foreign key ("member_id") references "member" ("id") on update cascade;
alter table "reservation" add constraint "reservation_screening_id_foreign" foreign key ("screening_id") references "screening" ("id") on update cascade;

alter table "seat_hold" add constraint "seat_hold_screening_id_foreign" foreign key ("screening_id") references "screening" ("id") on update cascade;
alter table "seat_hold" add constraint "seat_hold_seat_id_foreign" foreign key ("seat_id") references "seat" ("id") on update cascade;
alter table "seat_hold" add constraint "seat_hold_member_id_foreign" foreign key ("member_id") references "member" ("id") on update cascade;
alter table "seat_hold" add constraint "seat_hold_reservation_id_foreign" foreign key ("reservation_id") references "reservation" ("id") on update cascade on delete set null;

alter table "reservation_seat" add constraint "reservation_seat_reservation_id_foreign" foreign key ("reservation_id") references "reservation" ("id") on update cascade;
alter table "reservation_seat" add constraint "reservation_seat_screening_id_foreign" foreign key ("screening_id") references "screening" ("id") on update cascade;
alter table "reservation_seat" add constraint "reservation_seat_seat_id_foreign" foreign key ("seat_id") references "seat" ("id") on update cascade;

alter table "reservation_event" add constraint "reservation_event_reservation_id_foreign" foreign key ("reservation_id") references "reservation" ("id") on update cascade;

alter table "payment" add constraint "payment_member_id_foreign" foreign key ("member_id") references "member" ("id") on update cascade;
alter table "payment" add constraint "payment_seat_hold_id_foreign" foreign key ("seat_hold_id") references "seat_hold" ("id") on update cascade;
alter table "payment" add constraint "payment_reservation_id_foreign" foreign key ("reservation_id") references "reservation" ("id") on update cascade on delete set null;

alter table "payment_seat_hold" add constraint "payment_seat_hold_payment_id_foreign" foreign key ("payment_id") references "payment" ("id") on update cascade on delete cascade;
alter table "payment_seat_hold" add constraint "payment_seat_hold_seat_hold_id_foreign" foreign key ("seat_hold_id") references "seat_hold" ("id") on update cascade;

alter table "payment_event_log" add constraint "payment_event_log_payment_id_foreign" foreign key ("payment_id") references "payment" ("id") on update cascade;

create or replace function prevent_overlapping_screenings()
returns trigger as $$
begin
  if exists (
    select 1
    from "screening" existing
    where existing."screen_id" = new."screen_id"
      and existing."id" <> coalesce(new."id", 0)
      and existing."start_at" < new."end_at"
      and existing."end_at" > new."start_at"
  ) then
    raise exception 'screening time overlaps for screen_id=%', new."screen_id";
  end if;

  return new;
end;
$$ language plpgsql;

create trigger "trg_prevent_overlapping_screenings"
before insert or update of "screen_id", "start_at", "end_at"
on "screening"
for each row
execute function prevent_overlapping_screenings();
`);
  }
}
