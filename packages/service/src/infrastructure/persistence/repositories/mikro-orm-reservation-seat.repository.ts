import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { ReservationSeatModel } from '@domain';
import type { ReservationSeatRepositoryPort } from '@application/commands/ports';
import { ReservationSeatEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmReservationSeatRepository implements ReservationSeatRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: ReservationSeatModel): Promise<ReservationSeatModel> {
    const entity = PersistenceMapper.reservationSeatToEntity(model);
    this.entityManager.persist(entity);
    await this.entityManager.flush();
    return PersistenceMapper.reservationSeatToDomain(entity);
  }

  async findById(id: string): Promise<ReservationSeatModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationSeatEntity, { id });
    return entity ? PersistenceMapper.reservationSeatToDomain(entity) : undefined;
  }

  async findByScreeningAndSeat(screeningId: string, seatId: string): Promise<ReservationSeatModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationSeatEntity, {
      screening: screeningId,
      seat: seatId,
    });
    return entity ? PersistenceMapper.reservationSeatToDomain(entity) : undefined;
  }
}
