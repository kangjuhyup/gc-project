import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { ReservationEventModel } from '@domain';
import type { ReservationEventRepositoryPort } from '@application/commands/ports';
import { ReservationEventEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmReservationEventRepository implements ReservationEventRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: ReservationEventModel): Promise<ReservationEventModel> {
    const entity = PersistenceMapper.reservationEventToEntity(model);
    this.entityManager.persist(entity);
    await this.entityManager.flush();
    return PersistenceMapper.reservationEventToDomain(entity);
  }

  async findById(id: string): Promise<ReservationEventModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationEventEntity, { id });
    return entity ? PersistenceMapper.reservationEventToDomain(entity) : undefined;
  }
}
