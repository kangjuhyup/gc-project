import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { MovieImageEntity } from './movie-image.entity';
import { ScreeningEntity } from './screening.entity';

@Entity({ tableName: 'movie' })
export class MovieEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property({ length: 200 })
  title!: string;

  @Property({ length: 100, nullable: true })
  director?: string;

  @Property({ length: 50, nullable: true })
  genre?: string;

  @Property()
  runningTime!: number;

  @Property({ length: 20, nullable: true })
  rating?: string;

  @Property({ columnType: 'date', nullable: true })
  releaseDate?: Date;

  @Property({ length: 500, nullable: true })
  posterUrl?: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @OneToMany(() => ScreeningEntity, (screening) => screening.movie)
  screenings = new Collection<ScreeningEntity>(this);

  @OneToMany(() => MovieImageEntity, (image) => image.movie)
  images = new Collection<MovieImageEntity>(this);
}
