import { Logging, NoLog } from '@kangjuhyup/rvlog';
import type { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  AdminMovieListResultDto,
  AdminMovieSummaryDto,
  ListAdminMoviesQuery,
  ListMovieScheduleQuery,
  ListMoviesQuery,
  MovieListResultDto,
  MovieScheduleMovieDto,
  MovieScheduleResultDto,
  MovieScheduleScreeningDto,
  MovieScheduleTheaterDto,
  MovieSummaryDto,
  MovieTheaterSummaryDto,
} from '@application/query/dto';
import type { MovieQueryPort } from '@application/query/ports';
import { MovieEntity, ScreeningEntity } from '../entities';

interface MovieCursor {
  title: string;
  movieId: number;
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

  async listSchedule(query: ListMovieScheduleQuery): Promise<MovieScheduleResultDto> {
    const movie = await this.entityManager.findOne(MovieEntity, { id: query.movieId }, { populate: ['images'] });

    if (movie === null) {
      throw new Error('MOVIE_NOT_FOUND');
    }

    const screenings = await this.findScheduleRows(query);

    return MovieScheduleResultDto.of({
      movie: MovieScheduleMovieDto.of({
        id: Number(movie.id),
        title: movie.title,
        genre: movie.genre ?? '',
        rating: movie.rating ?? '',
        runningTime: movie.runningTime,
        posterUrl: this.posterUrl(movie) ?? '',
      }),
      date: query.date,
      theaters: this.toScheduleTheaterDtos(screenings),
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

  @NoLog
  private findAdminRows(query: ListAdminMoviesQuery): Promise<MovieEntity[]> {
    return this.entityManager.find(MovieEntity, this.buildAdminWhere(query), {
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit: query.countPerPage,
      offset: this.offset(query.currentPage, query.countPerPage),
    });
  }

  @NoLog
  private countAdminRows(query: ListAdminMoviesQuery): Promise<number> {
    return this.entityManager.count(MovieEntity, this.buildAdminWhere(query));
  }

  @NoLog
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

  @NoLog
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

  @NoLog
  private offset(currentPage: number, countPerPage: number): number {
    return (currentPage - 1) * countPerPage;
  }

  @NoLog
  private async findRows(query: ListMoviesQuery, cursor?: MovieCursor): Promise<MovieEntity[]> {
    const rows = await this.entityManager.find(MovieEntity, this.buildMovieWhere(query), {
      populate: ['images'],
      orderBy: { title: 'ASC', id: 'ASC' },
    });

    return rows
      .filter((row) => cursor === undefined || this.compareCursor(row, cursor) > 0)
      .slice(0, query.limit + 1);
  }

  @NoLog
  private buildMovieWhere(query: ListMoviesQuery): FilterQuery<MovieEntity> {
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

  @NoLog
  private posterUrl(movie: MovieEntity): string | undefined {
    const poster = movie.images
      ?.getItems()
      .filter((image) => image.imageType === 'POSTER')
      .sort((left, right) => left.sortOrder - right.sortOrder || Number(left.id) - Number(right.id))[0];

    return poster?.url ?? movie.posterUrl;
  }

  @NoLog
  private compareCursor(row: MovieEntity, cursor: MovieCursor): number {
    return row.title.localeCompare(cursor.title)
      || Number(row.id) - cursor.movieId;
  }

  @NoLog
  private toDto(row: MovieEntity): MovieSummaryDto {
    return MovieSummaryDto.of({
      id: Number(row.id),
      title: row.title,
      genre: row.genre ?? '',
      rating: row.rating ?? '',
      runningTime: row.runningTime,
      releaseDate: this.toDateLabel(row.releaseDate),
      posterUrl: this.posterUrl(row) ?? '',
      description: row.description ?? '',
    });
  }

  @NoLog
  private encodeCursor(row: MovieEntity | undefined): string | undefined {
    if (row === undefined) {
      return undefined;
    }

    return Buffer.from(
      JSON.stringify({
        title: row.title,
        movieId: Number(row.id),
      } satisfies MovieCursor),
      'utf8',
    ).toString('base64url');
  }

  @NoLog
  private decodeCursor(cursor: string | undefined): MovieCursor | undefined {
    if (cursor === undefined) {
      return undefined;
    }

    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Partial<MovieCursor>;

      if (
        typeof decoded.title !== 'string' ||
        typeof decoded.movieId !== 'number'
      ) {
        throw new Error('INVALID_MOVIE_CURSOR');
      }

      return {
        title: decoded.title,
        movieId: decoded.movieId,
      };
    } catch {
      throw new Error('INVALID_MOVIE_CURSOR');
    }
  }

  @NoLog
  private toIsoString(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }

  @NoLog
  private toDateLabel(value: string | Date | undefined): string {
    if (value === undefined) {
      return '';
    }

    return this.toIsoString(value).slice(0, 10);
  }

  @NoLog
  private toOptionalDateLabel(value: string | Date | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.toIsoString(value).slice(0, 10);
  }

  @NoLog
  private findScheduleRows(query: ListMovieScheduleQuery): Promise<ScreeningEntity[]> {
    return this.entityManager.find(ScreeningEntity, {
      movie: query.movieId,
      startAt: {
        $gte: query.startAt,
        $lt: query.endAt,
      },
    }, {
      populate: [
        'screen.theater',
        'reservationSeats.reservation',
      ],
      orderBy: {
        screen: {
          theater: { name: 'ASC' },
          name: 'ASC',
        },
        startAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  @NoLog
  private toScheduleTheaterDtos(screenings: ScreeningEntity[]): MovieScheduleTheaterDto[] {
    const screeningsByTheaterId = new Map<string, ScreeningEntity[]>();

    for (const screening of screenings) {
      const theaterId = String(screening.screen.theater.id);
      const rows = screeningsByTheaterId.get(theaterId) ?? [];
      rows.push(screening);
      screeningsByTheaterId.set(theaterId, rows);
    }

    return Array.from(screeningsByTheaterId.values())
      .sort((left, right) => this.compareTheaterScheduleGroups(left, right))
      .map((rows) => this.toScheduleTheaterDto(rows));
  }

  @NoLog
  private compareTheaterScheduleGroups(left: ScreeningEntity[], right: ScreeningEntity[]): number {
    const leftFirst = left[0];
    const rightFirst = right[0];

    return leftFirst.screen.theater.name.localeCompare(rightFirst.screen.theater.name)
      || Number(leftFirst.screen.theater.id) - Number(rightFirst.screen.theater.id);
  }

  @NoLog
  private toScheduleTheaterDto(screenings: ScreeningEntity[]): MovieScheduleTheaterDto {
    const theater = screenings[0].screen.theater;

    return MovieScheduleTheaterDto.of({
      theater: MovieTheaterSummaryDto.of({
        id: Number(theater.id),
        name: theater.name,
        address: theater.address,
      }),
      screenings: screenings
        .sort((left, right) => left.startAt.getTime() - right.startAt.getTime() || Number(left.id) - Number(right.id))
        .map((screening) => this.toScheduleScreeningDto(screening)),
    });
  }

  @NoLog
  private toScheduleScreeningDto(screening: ScreeningEntity): MovieScheduleScreeningDto {
    const reservedSeatCount = screening.reservationSeats
      .getItems()
      .filter((reservationSeat) => reservationSeat.reservation.status === 'CONFIRMED').length;

    return MovieScheduleScreeningDto.of({
      id: Number(screening.id),
      screenName: screening.screen.name,
      startAt: screening.startAt.toISOString(),
      endAt: screening.endAt.toISOString(),
      remainingSeats: Math.max(screening.screen.totalSeats - reservedSeatCount, 0),
      totalSeats: screening.screen.totalSeats,
      price: screening.price,
    });
  }
}
