import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { ReservationSeatModel } from '@domain';
import type { ReservationSeatRepositoryPort } from '@application/commands/ports';
import { ReservationEntity, ReservationSeatEntity, ScreeningEntity, SeatEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmReservationSeatRepository implements ReservationSeatRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: ReservationSeatModel): Promise<ReservationSeatModel> {
    const entity = PersistenceMapper.reservationSeatToEntity(model);
    entity.reservation = this.entityManager.getReference(ReservationEntity, entity.reservation.id);
    entity.screening = this.entityManager.getReference(ScreeningEntity, entity.screening.id);
    entity.seat = this.entityManager.getReference(SeatEntity, entity.seat.id);
    entity.id = String(await this.entityManager.insert(ReservationSeatEntity, entity));
    return PersistenceMapper.reservationSeatToDomain(entity);
  }

  async findById(id: string): Promise<ReservationSeatModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationSeatEntity, { id });
    return entity ? PersistenceMapper.reservationSeatToDomain(entity) : undefined;
  }

  async findByScreeningAndSeat(
    screeningId: string,
    seatId: string,
  ): Promise<ReservationSeatModel | undefined> {
    const entity = await this.entityManager.findOne(ReservationSeatEntity, {
      screening: screeningId,
      seat: seatId,
    });
    return entity ? PersistenceMapper.reservationSeatToDomain(entity) : undefined;
  }
}
