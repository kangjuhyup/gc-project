import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { ReservationModel } from '@domain';
import type { ReservationRepositoryPort } from '@application/commands/ports';
import { MemberEntity, ReservationEntity, ScreeningEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmReservationRepository implements ReservationRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: ReservationModel): Promise<ReservationModel> {
    const entity = PersistenceMapper.reservationToEntity(model);
    entity.member = this.entityManager.getReference(MemberEntity, entity.member.id);
    entity.screening = this.entityManager.getReference(ScreeningEntity, entity.screening.id);
    entity.id = String(await this.entityManager.insert(ReservationEntity, entity));
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
