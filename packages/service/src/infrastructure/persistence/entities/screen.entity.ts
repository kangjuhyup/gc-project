import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { ScreeningEntity } from './screening.entity';
import { SeatEntity } from './seat.entity';

@Entity({ tableName: 'screen' })
export class ScreenEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property({ length: 50 })
  name!: string;

  @Property()
  totalSeats!: number;

  @OneToMany(() => SeatEntity, (seat) => seat.screen)
  seats = new Collection<SeatEntity>(this);

  @OneToMany(() => ScreeningEntity, (screening) => screening.screen)
  screenings = new Collection<ScreeningEntity>(this);
}
