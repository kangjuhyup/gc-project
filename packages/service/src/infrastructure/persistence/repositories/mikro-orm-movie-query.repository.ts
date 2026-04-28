import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  ListMoviesQuery,
  MovieListResultDto,
  MovieScreeningSummaryDto,
  MovieSummaryDto,
  MovieTheaterSummaryDto,
} from '@application/query/dto';
import type { MovieQueryPort } from '@application/query/ports';

interface MovieListRow {
  movieId: string | number;
  title: string;
  genre?: string;
  rating?: string;
  runningTime: string | number;
  releaseDate?: string | Date;
  posterUrl?: string;
  description?: string;
  screeningId: string | number;
  theaterId: string | number;
  theaterName: string;
  theaterAddress: string;
  screenId: string | number;
  screenName: string;
  screeningStartAt: string | Date;
  screeningEndAt: string | Date;
  remainingSeats: string | number;
  totalSeats: string | number;
  distanceMs: string | number;
}

interface MovieCursor {
  distanceMs: number;
  screeningStartAt: string;
  screeningId: number;
}

@Injectable()
export class MikroOrmMovieQueryRepository implements MovieQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async list(query: ListMoviesQuery): Promise<MovieListResultDto> {
    const cursor = this.decodeCursor(query.cursor);
    const rows = await this.findRows(query, cursor);
    const hasNext = rows.length > query.limit;
    const items = rows.slice(0, query.limit);
    const nextCursor = hasNext ? this.encodeCursor(items[items.length - 1]) : undefined;

    return MovieListResultDto.of({
      items: items.map((row) => this.toDto(row)),
      hasNext,
      nextCursor,
    });
  }

  private async findRows(query: ListMoviesQuery, cursor?: MovieCursor): Promise<MovieListRow[]> {
    const params: Array<string | number> = [
      query.time.toISOString(),
      query.time.toISOString(),
    ];
    const innerWhere: string[] = [];
    const normalizedKeyword = query.keyword?.trim();

    if (normalizedKeyword) {
      const keyword = `%${normalizedKeyword}%`;
      innerWhere.push('(m.title ILIKE ? OR m.genre ILIKE ? OR m.rating ILIKE ? OR m.description ILIKE ?)');
      params.push(keyword, keyword, keyword, keyword);
    }

    const cursorWhere = this.buildCursorWhere(cursor, params);
    params.push(query.limit + 1);

    return this.entityManager.execute<MovieListRow[]>(
      `
        WITH ranked AS (
          SELECT
            m.id AS "movieId",
            m.title AS "title",
            m.genre AS "genre",
            m.rating AS "rating",
            m.running_time AS "runningTime",
            m.release_date AS "releaseDate",
            COALESCE(mi.url, m.poster_url) AS "posterUrl",
            m.description AS "description",
            s.id AS "screeningId",
            t.id AS "theaterId",
            t.name AS "theaterName",
            t.address AS "theaterAddress",
            sc.id AS "screenId",
            sc.name AS "screenName",
            s.start_at AS "screeningStartAt",
            s.end_at AS "screeningEndAt",
            GREATEST(sc.total_seats - COUNT(r.id), 0) AS "remainingSeats",
            sc.total_seats AS "totalSeats",
            ABS(EXTRACT(EPOCH FROM (s.start_at - ?::timestamptz)) * 1000)::bigint AS "distanceMs",
            ROW_NUMBER() OVER (
              PARTITION BY m.id
              ORDER BY
                ABS(EXTRACT(EPOCH FROM (s.start_at - ?::timestamptz)) * 1000) ASC,
                s.start_at ASC,
                s.id ASC
            ) AS "movieRank"
          FROM screening s
          JOIN movie m ON m.id = s.movie_id
          JOIN screen sc ON sc.id = s.screen_id
          JOIN theater t ON t.id = sc.theater_id
          LEFT JOIN LATERAL (
            SELECT movie_image.url
            FROM movie_image
            WHERE movie_image.movie_id = m.id
              AND movie_image.image_type = 'POSTER'
            ORDER BY movie_image.sort_order ASC, movie_image.id ASC
            LIMIT 1
          ) mi ON true
          LEFT JOIN reservation_seat rs ON rs.screening_id = s.id
          LEFT JOIN reservation r ON r.id = rs.reservation_id AND r.status = 'CONFIRMED'
          ${innerWhere.length ? `WHERE ${innerWhere.join(' AND ')}` : ''}
          GROUP BY
            m.id,
            m.title,
            m.genre,
            m.rating,
            m.running_time,
            m.release_date,
            m.poster_url,
            m.description,
            s.id,
            t.id,
            t.name,
            t.address,
            sc.id,
            sc.name,
            s.start_at,
            s.end_at,
            sc.total_seats
        )
        SELECT *
        FROM ranked
        WHERE "movieRank" = 1
        ${cursorWhere}
        ORDER BY "distanceMs" ASC, "screeningStartAt" ASC, "screeningId" ASC
        LIMIT ?
      `,
      params,
    );
  }

  private buildCursorWhere(cursor: MovieCursor | undefined, params: Array<string | number>): string {
    if (cursor === undefined) {
      return '';
    }

    params.push(cursor.distanceMs, cursor.distanceMs, cursor.screeningStartAt, cursor.distanceMs, cursor.screeningStartAt, cursor.screeningId);

    return `
      AND (
        "distanceMs" > ?
        OR ("distanceMs" = ? AND "screeningStartAt" > ?::timestamptz)
        OR ("distanceMs" = ? AND "screeningStartAt" = ?::timestamptz AND "screeningId" > ?)
      )
    `;
  }

  private toDto(row: MovieListRow): MovieSummaryDto {
    return MovieSummaryDto.of({
      id: Number(row.movieId),
      title: row.title,
      genre: row.genre ?? '',
      rating: row.rating ?? '',
      runningTime: Number(row.runningTime),
      releaseDate: this.toDateLabel(row.releaseDate),
      posterUrl: row.posterUrl ?? '',
      description: row.description ?? '',
      screenings: [
        MovieScreeningSummaryDto.of({
          id: Number(row.screeningId),
          screenName: row.screenName,
          startAt: this.toIsoString(row.screeningStartAt),
          endAt: this.toIsoString(row.screeningEndAt),
          remainingSeats: Number(row.remainingSeats),
          totalSeats: Number(row.totalSeats),
          theater: MovieTheaterSummaryDto.of({
            id: Number(row.theaterId),
            name: row.theaterName,
            address: row.theaterAddress,
          }),
        }),
      ],
    });
  }

  private encodeCursor(row: MovieListRow | undefined): string | undefined {
    if (row === undefined) {
      return undefined;
    }

    return Buffer.from(
      JSON.stringify({
        distanceMs: Number(row.distanceMs),
        screeningStartAt: this.toIsoString(row.screeningStartAt),
        screeningId: Number(row.screeningId),
      } satisfies MovieCursor),
      'utf8',
    ).toString('base64url');
  }

  private decodeCursor(cursor: string | undefined): MovieCursor | undefined {
    if (cursor === undefined) {
      return undefined;
    }

    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Partial<MovieCursor>;

      if (
        typeof decoded.distanceMs !== 'number' ||
        typeof decoded.screeningStartAt !== 'string' ||
        typeof decoded.screeningId !== 'number'
      ) {
        throw new Error('INVALID_MOVIE_CURSOR');
      }

      return {
        distanceMs: decoded.distanceMs,
        screeningStartAt: decoded.screeningStartAt,
        screeningId: decoded.screeningId,
      };
    } catch {
      throw new Error('INVALID_MOVIE_CURSOR');
    }
  }

  private toIsoString(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }

  private toDateLabel(value: string | Date | undefined): string {
    if (value === undefined) {
      return '';
    }

    return this.toIsoString(value).slice(0, 10);
  }
}
