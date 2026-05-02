import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { LockMode } from '@mikro-orm/core';
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
    this.applyReferences(entity);
    const existing =
      model.id === undefined
        ? undefined
        : await this.entityManager.findOne(ReservationEntity, { id: model.id });

    if (existing === undefined || existing === null) {
      entity.id = String(await this.entityManager.insert(ReservationEntity, entity));
      return PersistenceMapper.reservationToDomain(entity);
    }

    Object.assign(existing, entity);
    return PersistenceMapper.reservationToDomain(existing);
  }

  async findById(id: string): Promise<ReservationModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationEntity, { id });
    return entity ? PersistenceMapper.reservationToDomain(entity) : undefined;
  }

  async findByReservationNumber(reservationNumber: string): Promise<ReservationModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationEntity, { reservationNumber });
    return entity ? PersistenceMapper.reservationToDomain(entity) : undefined;
  }

  async findByIdForUpdate(id: string): Promise<ReservationModel | undefined> {
    const entity = await this.entityManager.findOne(
      ReservationEntity,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    return entity ? PersistenceMapper.reservationToDomain(entity) : undefined;
  }

  async hasIncompleteReservationByMemberId(params: {
    memberId: string;
    now: Date;
  }): Promise<boolean> {
    const entity = await this.entityManager.findOne(ReservationEntity, {
      member: params.memberId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      screening: {
        endAt: { $gt: params.now },
      },
    });

    return entity !== null;
  }

  @NoLog
  private applyReferences(entity: ReservationEntity): void {
    entity.member = this.entityManager.getReference(MemberEntity, entity.member.id);
    entity.screening = this.entityManager.getReference(ScreeningEntity, entity.screening.id);
  }
}
