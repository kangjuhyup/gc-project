import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { SeatHoldModel } from '@domain';
import type { SeatHoldRepositoryPort } from '@application/commands/ports';
import {
  MemberEntity,
  ReservationEntity,
  ReservationSeatEntity,
  ScreeningEntity,
  SeatEntity,
  SeatHoldEntity,
} from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmSeatHoldRepository implements SeatHoldRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: SeatHoldModel): Promise<SeatHoldModel> {
    const [saved] = await this.saveMany([model]);

    if (saved === undefined) {
      throw new Error('SEAT_HOLD_SAVE_FAILED');
    }

    return saved;
  }

  async saveMany(models: SeatHoldModel[]): Promise<SeatHoldModel[]> {
    const entities = [];

    for (const model of models) {
      const entity = PersistenceMapper.seatHoldToEntity(model);
      this.applyReferences(entity);
      const existing = model.id === undefined
        ? undefined
        : await this.entityManager.findOne(SeatHoldEntity, { id: model.id });

      if (existing === undefined || existing === null) {
        entity.id = String(await this.entityManager.insert(SeatHoldEntity, entity));
        entities.push(entity);
        continue;
      }

      Object.assign(existing, entity);
      entities.push(existing);
    }

    return entities.map((entity) => PersistenceMapper.seatHoldToDomain(entity));
  }

  async findById(id: string): Promise<SeatHoldModel | undefined> {
    const entity = await this.entityManager.findOne(SeatHoldEntity, { id });
    return entity ? PersistenceMapper.seatHoldToDomain(entity) : undefined;
  }

  async findActiveHold(screeningId: string, seatId: string): Promise<SeatHoldModel | undefined> {
    const entity = await this.entityManager.findOne(SeatHoldEntity, {
      screening: screeningId,
      seat: seatId,
      status: 'HELD',
      expiresAt: { $gt: new Date() },
    });
    return entity ? PersistenceMapper.seatHoldToDomain(entity) : undefined;
  }

  async findUnavailableSeatIds(params: {
    screeningId: string;
    seatIds: string[];
    now: Date;
  }): Promise<string[]> {
    if (params.seatIds.length === 0) {
      return [];
    }

    const [reservedSeats, heldSeats] = await Promise.all([
      this.entityManager.find(ReservationSeatEntity, {
        screening: params.screeningId,
        seat: { $in: params.seatIds },
        reservation: { status: { $in: ['PENDING', 'CONFIRMED'] } },
      }, { populate: ['seat'] }),
      this.entityManager.find(SeatHoldEntity, {
        screening: params.screeningId,
        seat: { $in: params.seatIds },
        status: 'HELD',
        expiresAt: { $gt: params.now },
      }, { populate: ['seat'] }),
    ]);

    return Array.from(new Set([
      ...reservedSeats.map((reservationSeat) => reservationSeat.seat.id),
      ...heldSeats.map((seatHold) => seatHold.seat.id),
    ]));
  }

  async findSeatIdsInScreening(params: {
    screeningId: string;
    seatIds: string[];
  }): Promise<string[]> {
    if (params.seatIds.length === 0) {
      return [];
    }

    const screening = await this.entityManager.findOne(ScreeningEntity, { id: params.screeningId }, {
      populate: ['screen'],
    });

    if (screening === null) {
      return [];
    }

    const seats = await this.entityManager.find(SeatEntity, {
      id: { $in: params.seatIds },
      screen: screening.screen.id,
    }, { orderBy: { id: 'ASC' } });

    return seats.map((seat) => seat.id);
  }

  private applyReferences(entity: SeatHoldEntity): void {
    entity.screening = this.entityManager.getReference(ScreeningEntity, entity.screening.id);
    entity.seat = this.entityManager.getReference(SeatEntity, entity.seat.id);
    entity.member = this.entityManager.getReference(MemberEntity, entity.member.id);
    entity.reservation = entity.reservation === undefined
      ? undefined
      : this.entityManager.getReference(ReservationEntity, entity.reservation.id);
  }
}
