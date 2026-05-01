import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ListScreeningSeatsQuery, ScreeningSeatListResultDto, ScreeningSeatSummaryDto } from '@application/query/dto';
import type { SeatQueryPort } from '@application/query/ports';
import { SeatAvailabilityStatus, type SeatAvailabilityStatusType } from '@domain';
import { ScreeningEntity, SeatEntity } from '../entities';

interface ScreeningSeatRow {
  seatId: string;
  seatRow: string;
  seatCol: number;
  seatType?: string;
  status: SeatAvailabilityStatusType;
}

@Injectable()
@Logging
export class MikroOrmSeatQueryRepository implements SeatQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async listByScreening(query: ListScreeningSeatsQuery): Promise<ScreeningSeatListResultDto> {
    const rows = await this.findRows(query.screeningId);

    return ScreeningSeatListResultDto.of({
      screeningId: query.screeningId,
      seats: rows.map((row) => this.toDto(row)),
    });
  }

  @NoLog
  private async findRows(screeningId: string): Promise<ScreeningSeatRow[]> {
    const screening = await this.entityManager.findOne(ScreeningEntity, { id: screeningId }, {
      populate: [
        'screen.seats',
        'reservationSeats.seat',
        'reservationSeats.reservation',
        'seatHolds.seat',
      ],
    });

    if (screening === null) {
      return [];
    }

    const reservedSeatIds = new Set(
      screening.reservationSeats
        .getItems()
        .filter((reservationSeat) => ['PENDING', 'CONFIRMED'].includes(reservationSeat.reservation.status))
        .map((reservationSeat) => reservationSeat.seat.id),
    );
    const now = new Date();
    const heldSeatIds = new Set(
      screening.seatHolds
        .getItems()
        .filter((seatHold) => seatHold.status === 'HELD' && seatHold.expiresAt > now)
        .map((seatHold) => seatHold.seat.id),
    );

    return screening.screen.seats
      .getItems()
      .slice()
      .sort((left, right) => this.compareSeat(left, right))
      .map((seat) => ({
        seatId: seat.id,
        seatRow: seat.seatRow,
        seatCol: seat.seatCol,
        seatType: seat.seatType ?? 'NORMAL',
        status: this.resolveStatus(seat.id, reservedSeatIds, heldSeatIds),
      }));
  }

  @NoLog
  private resolveStatus(
    seatId: string,
    reservedSeatIds: Set<string>,
    heldSeatIds: Set<string>,
  ): SeatAvailabilityStatusType {
    if (reservedSeatIds.has(seatId)) {
      return SeatAvailabilityStatus.RESERVED;
    }

    if (heldSeatIds.has(seatId)) {
      return SeatAvailabilityStatus.HELD;
    }

    return SeatAvailabilityStatus.AVAILABLE;
  }

  @NoLog
  private compareSeat(left: SeatEntity, right: SeatEntity): number {
    return left.seatRow.localeCompare(right.seatRow) || left.seatCol - right.seatCol || Number(left.id) - Number(right.id);
  }

  @NoLog
  private toDto(row: ScreeningSeatRow): ScreeningSeatSummaryDto {
    return ScreeningSeatSummaryDto.of({
      id: String(row.seatId),
      row: row.seatRow,
      col: Number(row.seatCol),
      type: row.seatType ?? 'NORMAL',
      status: row.status,
    });
  }
}
