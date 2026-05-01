import { Logging, NoLog } from '@kangjuhyup/rvlog';
import type { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  GetMyReservationQuery,
  ListMyReservationsQuery,
  ReservationDetailDto,
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
import { PaymentEntity, ReservationEntity, SeatEntity } from '../entities';

interface ReservationListItem {
  reservation: ReservationEntity;
  payment?: PaymentEntity;
}

interface ReservationCursor {
  createdAt: string;
  reservationId: number;
}

@Injectable()
@Logging
export class MikroOrmReservationQueryRepository implements ReservationQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async getMyReservation(query: GetMyReservationQuery): Promise<ReservationDetailDto | undefined> {
    const reservation = await this.entityManager.findOne(ReservationEntity, {
      id: query.reservationId,
      member: query.memberId,
    }, {
      populate: [
        'screening.movie.images',
        'screening.screen.theater',
        'reservationSeats.seat',
      ],
    });

    if (reservation === null) {
      return undefined;
    }

    const payment = await this.entityManager.findOne(PaymentEntity, {
      member: query.memberId,
      reservation: query.reservationId,
    }, { orderBy: { createdAt: 'DESC', id: 'DESC' } });

    return this.toDetailDto({ reservation, payment: payment ?? undefined });
  }

  async listMyReservations(query: ListMyReservationsQuery): Promise<ReservationListResultDto> {
    const cursor = this.decodeCursor(query.cursor);
    const results = await this.findRows(query, cursor);
    const hasNext = results.length > query.limit;
    const items = results.slice(0, query.limit);

    return ReservationListResultDto.of({
      items: items.map((item) => this.toDto(item)),
      hasNext,
      nextCursor: hasNext ? this.encodeCursor(items[items.length - 1]) : undefined,
    });
  }

  @NoLog
  private async findRows(query: ListMyReservationsQuery, cursor?: ReservationCursor): Promise<ReservationListItem[]> {
    const reservations = await this.entityManager.find(ReservationEntity, this.buildWhere(query, cursor), {
      populate: [
        'screening.movie.images',
        'screening.screen.theater',
        'reservationSeats.seat',
      ],
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit: query.limit + 1,
    });

    if (reservations.length === 0) {
      return [];
    }

    const payments = await this.entityManager.find(PaymentEntity, {
      member: query.memberId,
      reservation: { $in: reservations.map((reservation) => reservation.id) },
    }, { orderBy: { createdAt: 'DESC', id: 'DESC' } });
    const paymentsByReservationId = new Map<string, PaymentEntity>();

    for (const payment of payments) {
      const reservationId = payment.reservation?.id;

      if (reservationId !== undefined && !paymentsByReservationId.has(reservationId)) {
        paymentsByReservationId.set(reservationId, payment);
      }
    }

    return reservations.map((reservation) => ({
      reservation,
      payment: paymentsByReservationId.get(reservation.id),
    }));
  }

  @NoLog
  private buildWhere(
    query: ListMyReservationsQuery,
    cursor: ReservationCursor | undefined,
  ): FilterQuery<ReservationEntity> {
    const where: FilterQuery<ReservationEntity> = { member: query.memberId };

    if (cursor === undefined) {
      return where;
    }

    where.$or = [
      { createdAt: { $lt: new Date(cursor.createdAt) } },
      { createdAt: new Date(cursor.createdAt), id: { $lt: String(cursor.reservationId) } },
    ];

    return where;
  }

  @NoLog
  private toDetailDto(item: ReservationListItem): ReservationDetailDto {
    const { reservation, payment } = item;
    const screening = reservation.screening;
    const movie = screening.movie;
    const screen = screening.screen;
    const theater = screen.theater;

    return ReservationDetailDto.of({
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      status: reservation.status as ReservationStatusType,
      totalPrice: reservation.totalPrice,
      paymentAmount: payment?.amount,
      createdAt: this.toIsoString(reservation.createdAt),
      canceledAt: this.toOptionalIsoString(reservation.canceledAt),
      cancelReason: reservation.cancelReason,
      movie: ReservationMovieSummaryDto.of({
        id: movie.id,
        title: movie.title,
        rating: movie.rating,
        posterUrl: this.posterUrl(movie),
      }),
      screening: ReservationScreeningSummaryDto.of({
        id: screening.id,
        screenName: screen.name,
        startAt: this.toIsoString(screening.startAt),
        endAt: this.toIsoString(screening.endAt),
        theater: ReservationTheaterSummaryDto.of({
          id: theater.id,
          name: theater.name,
          address: theater.address,
        }),
      }),
      seats: reservation.reservationSeats.getItems().map((reservationSeat) => reservationSeat.seat)
        .sort((left, right) => this.compareSeat(left, right))
        .map((seat) =>
        ReservationSeatSummaryDto.of({
          id: seat.id,
          row: seat.seatRow,
          col: seat.seatCol,
          type: seat.seatType ?? 'NORMAL',
        }),
      ),
      payment: payment === undefined
        ? undefined
        : ReservationPaymentSummaryDto.of({
            id: payment.id,
            status: payment.status as PaymentStatusType,
            amount: payment.amount,
            providerPaymentId: payment.providerPaymentId,
          }),
    });
  }

  @NoLog
  private toDto(item: ReservationListItem): ReservationSummaryDto {
    const { reservation, payment } = item;
    const screening = reservation.screening;
    const movie = screening.movie;
    const screen = screening.screen;
    const theater = screen.theater;

    return ReservationSummaryDto.of({
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      status: reservation.status as ReservationStatusType,
      totalPrice: reservation.totalPrice,
      createdAt: this.toIsoString(reservation.createdAt),
      canceledAt: this.toOptionalIsoString(reservation.canceledAt),
      cancelReason: reservation.cancelReason,
      movie: ReservationMovieSummaryDto.of({
        id: movie.id,
        title: movie.title,
        rating: movie.rating,
        posterUrl: this.posterUrl(movie),
      }),
      screening: ReservationScreeningSummaryDto.of({
        id: screening.id,
        screenName: screen.name,
        startAt: this.toIsoString(screening.startAt),
        endAt: this.toIsoString(screening.endAt),
        theater: ReservationTheaterSummaryDto.of({
          id: theater.id,
          name: theater.name,
          address: theater.address,
        }),
      }),
      seats: reservation.reservationSeats.getItems().map((reservationSeat) => reservationSeat.seat)
        .sort((left, right) => this.compareSeat(left, right))
        .map((seat) =>
        ReservationSeatSummaryDto.of({
          id: seat.id,
          row: seat.seatRow,
          col: seat.seatCol,
          type: seat.seatType ?? 'NORMAL',
        }),
      ),
      payment: payment === undefined
        ? undefined
        : ReservationPaymentSummaryDto.of({
            id: payment.id,
            status: payment.status as PaymentStatusType,
            amount: payment.amount,
            providerPaymentId: payment.providerPaymentId,
          }),
    });
  }

  @NoLog
  private encodeCursor(item: ReservationListItem | undefined): string | undefined {
    if (item === undefined) {
      return undefined;
    }

    return Buffer.from(
      JSON.stringify({
        createdAt: this.toIsoString(item.reservation.createdAt),
        reservationId: Number(item.reservation.id),
      } satisfies ReservationCursor),
      'utf8',
    ).toString('base64url');
  }

  @NoLog
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

  @NoLog
  private posterUrl(movie: ReservationEntity['screening']['movie']): string | undefined {
    const poster = movie.images
      .getItems()
      .filter((image) => image.imageType === 'POSTER')
      .sort((left, right) => left.sortOrder - right.sortOrder || Number(left.id) - Number(right.id))[0];

    return poster?.url ?? movie.posterUrl;
  }

  @NoLog
  private compareSeat(left: SeatEntity, right: SeatEntity): number {
    return left.seatRow.localeCompare(right.seatRow) || left.seatCol - right.seatCol || Number(left.id) - Number(right.id);
  }

  @NoLog
  private toIsoString(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }

  @NoLog
  private toOptionalIsoString(value: string | Date | undefined): string | undefined {
    return value === undefined ? undefined : this.toIsoString(value);
  }
}
