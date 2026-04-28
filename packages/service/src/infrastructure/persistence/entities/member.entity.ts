import { Collection, Entity, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { ReservationEntity } from './reservation.entity';
import { SeatHoldEntity } from './seat-hold.entity';

@Entity({ tableName: 'member' })
@Unique({ name: 'uq_member_user_id', properties: ['userId'] })
@Unique({ name: 'uq_member_phone_number', properties: ['phoneNumber'] })
export class MemberEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property({ length: 30 })
  userId!: string;

  @Property({ length: 50 })
  name!: string;

  @Property({ columnType: 'date' })
  birthDate!: Date;

  @Property({ length: 20 })
  phoneNumber!: string;

  @Property({ length: 255 })
  address!: string;

  @Property({ length: 20 })
  status!: string;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => ReservationEntity, (reservation) => reservation.member)
  reservations = new Collection<ReservationEntity>(this);

  @OneToMany(() => SeatHoldEntity, (seatHold) => seatHold.member)
  seatHolds = new Collection<SeatHoldEntity>(this);
}
