import { Collection, Entity, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { ScreenEntity } from './screen.entity';

@Entity({ tableName: 'theater' })
@Unique({ name: 'uq_theater_name', properties: ['name'] })
export class TheaterEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property({ length: 100 })
  name!: string;

  @Property({ length: 255 })
  address!: string;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @OneToMany(() => ScreenEntity, (screen) => screen.theater)
  screens = new Collection<ScreenEntity>(this);
}
