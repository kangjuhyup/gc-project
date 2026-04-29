import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { ReservationModel } from '@domain';
import type { ReservationRepositoryPort } from '@application/commands/ports';
import { ReservationEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmReservationRepository implements ReservationRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: ReservationModel): Promise<ReservationModel> {
    const entity = PersistenceMapper.reservationToEntity(model);
    this.entityManager.persist(entity);
    await this.entityManager.flush();
    return PersistenceMapper.reservationToDomain(entity);
  }

  async findById(id: string): Promise<ReservationModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationEntity, { id });
    return entity ? PersistenceMapper.reservationToDomain(entity) : undefined;
  }

  async findByReservationNumber(reservationNumber: string): Promise<ReservationModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationEntity, { reservationNumber });
    return entity ? PersistenceMapper.reservationToDomain(entity) : undefined;
  }
}
