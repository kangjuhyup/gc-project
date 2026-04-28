import { Entity, Index, ManyToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { ReservationEntity } from './reservation.entity';

@Entity({ tableName: 'reservation_event' })
@Index({ name: 'idx_reservation_event', properties: ['reservation', 'createdAt'] })
export class ReservationEventEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => ReservationEntity, fieldName: 'reservation_id' })
  reservation!: Rel<ReservationEntity>;

  @Property({ length: 30 })
  eventType!: string;

  @Property({ length: 255, nullable: true })
  description?: string;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();
}
