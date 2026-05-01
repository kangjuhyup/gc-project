import { Logging } from '@kangjuhyup/rvlog';
import type { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  AdminMovieListResultDto,
  AdminMovieSummaryDto,
  ListAdminMoviesQuery,
  ListMoviesQuery,
  MovieListResultDto,
  MovieScreeningSummaryDto,
  MovieSummaryDto,
  MovieTheaterSummaryDto,
} from '@application/query/dto';
import type { MovieQueryPort } from '@application/query/ports';
import { MovieEntity, ScreeningEntity } from '../entities';

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
@Logging
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

  async listAdminMovies(query: ListAdminMoviesQuery): Promise<AdminMovieListResultDto> {
    const [rows, totalCount] = await Promise.all([
      this.findAdminRows(query),
      this.countAdminRows(query),
    ]);

    return AdminMovieListResultDto.of({
      totalCount,
      currentPage: query.currentPage,
      countPerPage: query.countPerPage,
      items: rows.map((row) => this.toAdminDto(row)),
    });
  }

  private findAdminRows(query: ListAdminMoviesQuery): Promise<MovieEntity[]> {
    return this.entityManager.find(MovieEntity, this.buildAdminWhere(query), {
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit: query.countPerPage,
      offset: this.offset(query.currentPage, query.countPerPage),
    });
  }

  private countAdminRows(query: ListAdminMoviesQuery): Promise<number> {
    return this.entityManager.count(MovieEntity, this.buildAdminWhere(query));
  }

  private buildAdminWhere(query: ListAdminMoviesQuery): FilterQuery<MovieEntity> {
    const where: FilterQuery<MovieEntity> = {};
    const normalizedKeyword = query.keyword?.trim();

    if (normalizedKeyword) {
      const keyword = `%${normalizedKeyword}%`;
      where.$or = [
        { title: { $ilike: keyword } },
        { director: { $ilike: keyword } },
        { genre: { $ilike: keyword } },
        { rating: { $ilike: keyword } },
        { description: { $ilike: keyword } },
      ];
    }

    return where;
  }

  private toAdminDto(row: MovieEntity): AdminMovieSummaryDto {
    return AdminMovieSummaryDto.of({
      id: String(row.id),
      title: row.title,
      director: row.director,
      genre: row.genre,
      runningTime: row.runningTime,
      rating: row.rating,
      releaseDate: this.toOptionalDateLabel(row.releaseDate),
      posterUrl: row.posterUrl,
      description: row.description,
      createdAt: this.toIsoString(row.createdAt),
    });
  }

  private offset(currentPage: number, countPerPage: number): number {
    return (currentPage - 1) * countPerPage;
  }

  private async findRows(query: ListMoviesQuery, cursor?: MovieCursor): Promise<MovieListRow[]> {
    const screenings = await this.entityManager.find(ScreeningEntity, this.buildScreeningWhere(query), {
      populate: [
        'movie.images',
        'screen.theater',
        'reservationSeats.reservation',
      ],
      orderBy: { startAt: 'ASC', id: 'ASC' },
    });
    const nearestRowsByMovieId = new Map<string, MovieListRow>();

    for (const screening of screenings) {
      const row = this.toRow(screening, query.time);
      const current = nearestRowsByMovieId.get(row.movieId.toString());

      if (current === undefined || this.compareMovieRows(row, current) < 0) {
        nearestRowsByMovieId.set(row.movieId.toString(), row);
      }
    }

    return Array.from(nearestRowsByMovieId.values())
      .sort((left, right) => this.compareMovieRows(left, right))
      .filter((row) => cursor === undefined || this.compareCursor(row, cursor) > 0)
      .slice(0, query.limit + 1);
  }

  private buildScreeningWhere(query: ListMoviesQuery): FilterQuery<ScreeningEntity> {
    const where: FilterQuery<ScreeningEntity> = {
      startAt: { $gte: query.time },
    };
    const normalizedKeyword = query.keyword?.trim();

    if (normalizedKeyword) {
      const keyword = `%${normalizedKeyword}%`;
      where.movie = {
        $or: [
          { title: { $ilike: keyword } },
          { genre: { $ilike: keyword } },
          { rating: { $ilike: keyword } },
          { description: { $ilike: keyword } },
        ],
      };
    }

    return where;
  }

  private toRow(screening: ScreeningEntity, time: Date): MovieListRow {
    const movie = screening.movie;
    const screen = screening.screen;
    const theater = screen.theater;
    const reservedSeatCount = screening.reservationSeats
      .getItems()
      .filter((reservationSeat) => reservationSeat.reservation.status === 'CONFIRMED').length;

    return {
      movieId: movie.id,
      title: movie.title,
      genre: movie.genre,
      rating: movie.rating,
      runningTime: movie.runningTime,
      releaseDate: movie.releaseDate,
      posterUrl: this.posterUrl(movie),
      description: movie.description,
      screeningId: screening.id,
      theaterId: theater.id,
      theaterName: theater.name,
      theaterAddress: theater.address,
      screenId: screen.id,
      screenName: screen.name,
      screeningStartAt: screening.startAt,
      screeningEndAt: screening.endAt,
      remainingSeats: Math.max(screen.totalSeats - reservedSeatCount, 0),
      totalSeats: screen.totalSeats,
      distanceMs: Math.abs(screening.startAt.getTime() - time.getTime()),
    };
  }

  private posterUrl(movie: MovieEntity): string | undefined {
    const poster = movie.images
      .getItems()
      .filter((image) => image.imageType === 'POSTER')
      .sort((left, right) => left.sortOrder - right.sortOrder || Number(left.id) - Number(right.id))[0];

    return poster?.url ?? movie.posterUrl;
  }

  private compareMovieRows(left: MovieListRow, right: MovieListRow): number {
    return Number(left.distanceMs) - Number(right.distanceMs)
      || new Date(left.screeningStartAt).getTime() - new Date(right.screeningStartAt).getTime()
      || Number(left.screeningId) - Number(right.screeningId);
  }

  private compareCursor(row: MovieListRow, cursor: MovieCursor): number {
    return Number(row.distanceMs) - cursor.distanceMs
      || new Date(row.screeningStartAt).getTime() - new Date(cursor.screeningStartAt).getTime()
      || Number(row.screeningId) - cursor.screeningId;
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

  private toOptionalDateLabel(value: string | Date | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.toIsoString(value).slice(0, 10);
  }
}
