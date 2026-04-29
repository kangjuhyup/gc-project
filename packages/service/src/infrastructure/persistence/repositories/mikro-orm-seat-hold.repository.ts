import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { SeatHoldModel } from '@domain';
import type { SeatHoldRepositoryPort } from '@application/commands/ports';
import { SeatHoldEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

interface SeatIdRow {
  seatId: string | number;
}

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
    const entities = models.map((model) => PersistenceMapper.seatHoldToEntity(model));
    this.entityManager.persist(entities);
    await this.entityManager.flush();
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

    const placeholders = this.placeholders(params.seatIds);
    const rows = await this.entityManager.execute<SeatIdRow[]>(
      `
        SELECT DISTINCT unavailable.seat_id AS "seatId"
        FROM (
          SELECT reservation_seat.seat_id
          FROM reservation_seat
          JOIN reservation ON reservation.id = reservation_seat.reservation_id
          WHERE reservation_seat.screening_id = ?
            AND reservation_seat.seat_id IN (${placeholders})
            AND reservation.status IN ('PENDING', 'CONFIRMED')

          UNION

          SELECT seat_hold.seat_id
          FROM seat_hold
          WHERE seat_hold.screening_id = ?
            AND seat_hold.seat_id IN (${placeholders})
            AND seat_hold.status = 'HELD'
            AND seat_hold.expires_at > ?::timestamptz
        ) unavailable
      `,
      [
        params.screeningId,
        ...params.seatIds,
        params.screeningId,
        ...params.seatIds,
        params.now.toISOString(),
      ],
    );

    return rows.map((row) => String(row.seatId));
  }

  async findSeatIdsInScreening(params: {
    screeningId: string;
    seatIds: string[];
  }): Promise<string[]> {
    if (params.seatIds.length === 0) {
      return [];
    }

    const placeholders = this.placeholders(params.seatIds);
    const rows = await this.entityManager.execute<SeatIdRow[]>(
      `
        SELECT seat.id AS "seatId"
        FROM seat
        JOIN screening ON screening.screen_id = seat.screen_id
        WHERE screening.id = ?
          AND seat.id IN (${placeholders})
      `,
      [params.screeningId, ...params.seatIds],
    );

    return rows.map((row) => String(row.seatId));
  }

  private placeholders(values: string[]): string {
    return values.map(() => '?').join(', ');
  }
}
