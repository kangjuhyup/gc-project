import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
  Unique,
} from '@mikro-orm/core';
import { ScreeningEntity } from './screening.entity';
import { SeatEntity } from './seat.entity';
import { TheaterEntity } from './theater.entity';

@Entity({ tableName: 'screen' })
@Unique({ name: 'uq_screen_theater_name', properties: ['theater', 'name'] })
export class ScreenEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => TheaterEntity, fieldName: 'theater_id' })
  theater!: Rel<TheaterEntity>;

  @Property({ length: 50 })
  name!: string;

  @Property()
  totalSeats!: number;

  @OneToMany(() => SeatEntity, (seat) => seat.screen)
  seats = new Collection<SeatEntity>(this);

  @OneToMany(() => ScreeningEntity, (screening) => screening.screen)
  screenings = new Collection<ScreeningEntity>(this);
}
