import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { ReservationEventModel } from '@domain';
import type { ReservationEventRepositoryPort } from '@application/commands/ports';
import { ReservationEntity, ReservationEventEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmReservationEventRepository implements ReservationEventRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: ReservationEventModel): Promise<ReservationEventModel> {
    const entity = PersistenceMapper.reservationEventToEntity(model);
    entity.reservation = this.entityManager.getReference(ReservationEntity, entity.reservation.id);
    entity.id = String(await this.entityManager.insert(ReservationEventEntity, entity));
    return PersistenceMapper.reservationEventToDomain(entity);
  }

  async findById(id: string): Promise<ReservationEventModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationEventEntity, { id });
    return entity ? PersistenceMapper.reservationEventToDomain(entity) : undefined;
  }
}
