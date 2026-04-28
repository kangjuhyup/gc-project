import { Entity, Index, ManyToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { MemberEntity } from './member.entity';
import { ReservationEntity } from './reservation.entity';
import { ScreeningEntity } from './screening.entity';
import { SeatEntity } from './seat.entity';

@Entity({ tableName: 'seat_hold' })
@Index({ name: 'idx_hold_member_status', properties: ['member', 'status', 'createdAt'] })
@Index({ name: 'idx_hold_screening_active', properties: ['screening', 'status'] })
@Index({ name: 'idx_hold_expires_active', properties: ['expiresAt', 'status'] })
export class SeatHoldEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => ScreeningEntity, fieldName: 'screening_id' })
  screening!: Rel<ScreeningEntity>;

  @ManyToOne({ entity: () => SeatEntity, fieldName: 'seat_id' })
  seat!: Rel<SeatEntity>;

  @ManyToOne({ entity: () => MemberEntity, fieldName: 'member_id' })
  member!: Rel<MemberEntity>;

  @ManyToOne({ entity: () => ReservationEntity, fieldName: 'reservation_id', nullable: true })
  reservation?: Rel<ReservationEntity>;

  @Property({ length: 20 })
  status!: string;

  @Property({ columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
