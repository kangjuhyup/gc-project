import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { EncryptedProperty } from '../encryption';
import { ReservationEntity } from './reservation.entity';
import { SeatHoldEntity } from './seat-hold.entity';

@Entity({ tableName: 'member' })
export class MemberEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property({ length: 30 })
  userId!: string;

  @Property({ length: 255 })
  passwordHash!: string;

  @Property({ length: 50 })
  name!: string;

  @Property({ columnType: 'date' })
  birthDate!: Date;

  @EncryptedProperty()
  @Property({ length: 255 })
  phoneNumber!: string;

  @Property({ length: 255 })
  address!: string;

  @Property({ length: 20 })
  status!: string;

  @Property({ default: 0 })
  failedLoginCount: number = 0;

  @Property({ columnType: 'timestamptz', nullable: true })
  lockedAt?: Date;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => ReservationEntity, (reservation) => reservation.member)
  reservations = new Collection<ReservationEntity>(this);

  @OneToMany(() => SeatHoldEntity, (seatHold) => seatHold.member)
  seatHolds = new Collection<SeatHoldEntity>(this);
}
