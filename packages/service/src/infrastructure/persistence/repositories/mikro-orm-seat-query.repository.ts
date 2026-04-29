import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ListScreeningSeatsQuery, ScreeningSeatListResultDto, ScreeningSeatSummaryDto } from '@application/query/dto';
import type { SeatQueryPort } from '@application/query/ports';
import { SeatAvailabilityStatus, type SeatAvailabilityStatusType } from '@domain';

interface ScreeningSeatRow {
  seatId: string | number;
  seatRow: string;
  seatCol: string | number;
  seatType?: string;
  status: SeatAvailabilityStatusType;
}

@Injectable()
export class MikroOrmSeatQueryRepository implements SeatQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async listByScreening(query: ListScreeningSeatsQuery): Promise<ScreeningSeatListResultDto> {
    const rows = await this.findRows(query.screeningId);

    return ScreeningSeatListResultDto.of({
      screeningId: query.screeningId,
      seats: rows.map((row) => this.toDto(row)),
    });
  }

  private findRows(screeningId: string): Promise<ScreeningSeatRow[]> {
    return this.entityManager.execute<ScreeningSeatRow[]>(
      `
        SELECT
          seat.id AS "seatId",
          seat.seat_row AS "seatRow",
          seat.seat_col AS "seatCol",
          COALESCE(seat.seat_type, 'NORMAL') AS "seatType",
          CASE
            WHEN COUNT(reserved.id) > 0 THEN 'RESERVED'
            WHEN COUNT(active_hold.id) > 0 THEN 'HELD'
            ELSE 'AVAILABLE'
          END AS "status"
        FROM screening
        JOIN seat ON seat.screen_id = screening.screen_id
        LEFT JOIN reservation_seat reserved_seat
          ON reserved_seat.screening_id = screening.id
          AND reserved_seat.seat_id = seat.id
        LEFT JOIN reservation reserved
          ON reserved.id = reserved_seat.reservation_id
          AND reserved.status IN ('PENDING', 'CONFIRMED')
        LEFT JOIN seat_hold active_hold
          ON active_hold.screening_id = screening.id
          AND active_hold.seat_id = seat.id
          AND active_hold.status = 'HELD'
          AND active_hold.expires_at > now()
        WHERE screening.id = ?
        GROUP BY seat.id, seat.seat_row, seat.seat_col, seat.seat_type
        ORDER BY seat.seat_row ASC, seat.seat_col ASC, seat.id ASC
      `,
      [screeningId],
    );
  }

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
