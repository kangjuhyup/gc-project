import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { MovieModel } from '@domain';
import type { MovieRepositoryPort } from '@application/commands/ports';
import { MovieEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmMovieRepository implements MovieRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: MovieModel): Promise<MovieModel> {
    const entity = PersistenceMapper.movieToEntity(model);
    const existing =
      model.id === undefined
        ? undefined
        : await this.entityManager.findOne(MovieEntity, { id: model.id });

    if (existing === undefined || existing === null) {
      entity.id = String(await this.entityManager.insert(MovieEntity, entity));
      return PersistenceMapper.movieToDomain(entity);
    }

    Object.assign(existing, entity);
    return PersistenceMapper.movieToDomain(existing);
  }

  async findById(id: string): Promise<MovieModel | undefined> {
    const entity = await this.entityManager.findOne(MovieEntity, { id });
    return entity ? PersistenceMapper.movieToDomain(entity) : undefined;
  }
}
