import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  ListMyReservationsQuery,
  ReservationListResultDto,
  ReservationMovieSummaryDto,
  ReservationPaymentSummaryDto,
  ReservationScreeningSummaryDto,
  ReservationSeatSummaryDto,
  ReservationSummaryDto,
  ReservationTheaterSummaryDto,
} from '@application/query/dto';
import type { ReservationQueryPort } from '@application/query/ports';
import type { PaymentStatusType, ReservationStatusType } from '@domain';

interface ReservationListRow {
  reservationId: string | number;
  reservationNumber: string;
  reservationStatus: ReservationStatusType;
  totalPrice: string | number;
  reservationCreatedAt: string | Date;
  canceledAt?: string | Date;
  cancelReason?: string;
  movieId: string | number;
  movieTitle: string;
  movieRating?: string;
  moviePosterUrl?: string;
  screeningId: string | number;
  screenName: string;
  screeningStartAt: string | Date;
  screeningEndAt: string | Date;
  theaterId: string | number;
  theaterName: string;
  theaterAddress: string;
  paymentId?: string | number;
  paymentStatus?: PaymentStatusType;
  paymentAmount?: string | number;
  providerPaymentId?: string;
  seats: ReservationSeatJson[] | string;
}

interface ReservationSeatJson {
  id: string | number;
  row: string;
  col: string | number;
  type?: string;
}

interface ReservationCursor {
  createdAt: string;
  reservationId: number;
}

@Injectable()
@Logging
export class MikroOrmReservationQueryRepository implements ReservationQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async listMyReservations(query: ListMyReservationsQuery): Promise<ReservationListResultDto> {
    const cursor = this.decodeCursor(query.cursor);
    const rows = await this.findRows(query, cursor);
    const hasNext = rows.length > query.limit;
    const items = rows.slice(0, query.limit);

    return ReservationListResultDto.of({
      items: items.map((row) => this.toDto(row)),
      hasNext,
      nextCursor: hasNext ? this.encodeCursor(items[items.length - 1]) : undefined,
    });
  }

  private findRows(query: ListMyReservationsQuery, cursor?: ReservationCursor): Promise<ReservationListRow[]> {
    const params: Array<string | number> = [query.memberId];
    const cursorWhere = this.buildCursorWhere(cursor, params);
    params.push(query.limit + 1);

    return this.entityManager.execute<ReservationListRow[]>(
      `
        SELECT
          r.id AS "reservationId",
          r.reservation_number AS "reservationNumber",
          r.status AS "reservationStatus",
          r.total_price AS "totalPrice",
          r.created_at AS "reservationCreatedAt",
          r.canceled_at AS "canceledAt",
          r.cancel_reason AS "cancelReason",
          m.id AS "movieId",
          m.title AS "movieTitle",
          m.rating AS "movieRating",
          COALESCE(mi.url, m.poster_url) AS "moviePosterUrl",
          sg.id AS "screeningId",
          sc.name AS "screenName",
          sg.start_at AS "screeningStartAt",
          sg.end_at AS "screeningEndAt",
          t.id AS "theaterId",
          t.name AS "theaterName",
          t.address AS "theaterAddress",
          p.id AS "paymentId",
          p.status AS "paymentStatus",
          p.amount AS "paymentAmount",
          p.provider_payment_id AS "providerPaymentId",
          COALESCE(
            json_agg(
              json_build_object(
                'id', seat.id::text,
                'row', seat.seat_row,
                'col', seat.seat_col,
                'type', COALESCE(seat.seat_type, 'NORMAL')
              )
              ORDER BY seat.seat_row ASC, seat.seat_col ASC, seat.id ASC
            ) FILTER (WHERE seat.id IS NOT NULL),
            '[]'::json
          ) AS seats
        FROM reservation r
        JOIN screening sg ON sg.id = r.screening_id
        JOIN movie m ON m.id = sg.movie_id
        JOIN screen sc ON sc.id = sg.screen_id
        JOIN theater t ON t.id = sc.theater_id
        LEFT JOIN payment p ON p.reservation_id = r.id AND p.member_id = r.member_id
        LEFT JOIN reservation_seat rs ON rs.reservation_id = r.id
        LEFT JOIN seat ON seat.id = rs.seat_id
        LEFT JOIN LATERAL (
          SELECT movie_image.url
          FROM movie_image
          WHERE movie_image.movie_id = m.id
            AND movie_image.image_type = 'POSTER'
          ORDER BY movie_image.sort_order ASC, movie_image.id ASC
          LIMIT 1
        ) mi ON true
        WHERE r.member_id = ?
        ${cursorWhere}
        GROUP BY
          r.id,
          r.reservation_number,
          r.status,
          r.total_price,
          r.created_at,
          r.canceled_at,
          r.cancel_reason,
          m.id,
          m.title,
          m.rating,
          m.poster_url,
          mi.url,
          sg.id,
          sc.name,
          sg.start_at,
          sg.end_at,
          t.id,
          t.name,
          t.address,
          p.id,
          p.status,
          p.amount,
          p.provider_payment_id
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT ?
      `,
      params,
    );
  }

  private buildCursorWhere(cursor: ReservationCursor | undefined, params: Array<string | number>): string {
    if (cursor === undefined) {
      return '';
    }

    params.push(cursor.createdAt, cursor.createdAt, cursor.reservationId);

    return `
      AND (
        r.created_at < ?::timestamptz
        OR (r.created_at = ?::timestamptz AND r.id < ?)
      )
    `;
  }

  private toDto(row: ReservationListRow): ReservationSummaryDto {
    return ReservationSummaryDto.of({
      id: String(row.reservationId),
      reservationNumber: row.reservationNumber,
      status: row.reservationStatus,
      totalPrice: Number(row.totalPrice),
      createdAt: this.toIsoString(row.reservationCreatedAt),
      canceledAt: this.toOptionalIsoString(row.canceledAt),
      cancelReason: row.cancelReason,
      movie: ReservationMovieSummaryDto.of({
        id: String(row.movieId),
        title: row.movieTitle,
        rating: row.movieRating,
        posterUrl: row.moviePosterUrl,
      }),
      screening: ReservationScreeningSummaryDto.of({
        id: String(row.screeningId),
        screenName: row.screenName,
        startAt: this.toIsoString(row.screeningStartAt),
        endAt: this.toIsoString(row.screeningEndAt),
        theater: ReservationTheaterSummaryDto.of({
          id: String(row.theaterId),
          name: row.theaterName,
          address: row.theaterAddress,
        }),
      }),
      seats: this.parseSeats(row.seats).map((seat) =>
        ReservationSeatSummaryDto.of({
          id: String(seat.id),
          row: seat.row,
          col: Number(seat.col),
          type: seat.type ?? 'NORMAL',
        }),
      ),
      payment: row.paymentId === undefined
        ? undefined
        : ReservationPaymentSummaryDto.of({
            id: String(row.paymentId),
            status: row.paymentStatus as PaymentStatusType,
            amount: Number(row.paymentAmount),
            providerPaymentId: row.providerPaymentId,
          }),
    });
  }

  private encodeCursor(row: ReservationListRow | undefined): string | undefined {
    if (row === undefined) {
      return undefined;
    }

    return Buffer.from(
      JSON.stringify({
        createdAt: this.toIsoString(row.reservationCreatedAt),
        reservationId: Number(row.reservationId),
      } satisfies ReservationCursor),
      'utf8',
    ).toString('base64url');
  }

  private decodeCursor(cursor: string | undefined): ReservationCursor | undefined {
    if (cursor === undefined) {
      return undefined;
    }

    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Partial<ReservationCursor>;

      if (
        typeof decoded.createdAt !== 'string' ||
        Number.isNaN(new Date(decoded.createdAt).getTime()) ||
        typeof decoded.reservationId !== 'number'
      ) {
        throw new Error('INVALID_RESERVATION_CURSOR');
      }

      return {
        createdAt: decoded.createdAt,
        reservationId: decoded.reservationId,
      };
    } catch {
      throw new Error('INVALID_RESERVATION_CURSOR');
    }
  }

  private parseSeats(rowSeats: ReservationListRow['seats']): ReservationSeatJson[] {
    return typeof rowSeats === 'string' ? JSON.parse(rowSeats) as ReservationSeatJson[] : rowSeats;
  }

  private toIsoString(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }

  private toOptionalIsoString(value: string | Date | undefined): string | undefined {
    return value === undefined ? undefined : this.toIsoString(value);
  }
}
