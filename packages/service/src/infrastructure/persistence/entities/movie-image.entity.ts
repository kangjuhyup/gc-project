import { Entity, Index, ManyToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { MovieEntity } from './movie.entity';

@Entity({ tableName: 'movie_image' })
@Index({ name: 'idx_movie_image_movie_type_order', properties: ['movie', 'imageType', 'sortOrder'] })
export class MovieImageEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne({ entity: () => MovieEntity, fieldName: 'movie_id' })
  movie!: Rel<MovieEntity>;

  @Property({ length: 20 })
  imageType!: string;

  @Property({ length: 500 })
  url!: string;

  @Property({ default: 0 })
  sortOrder: number = 0;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();
}
