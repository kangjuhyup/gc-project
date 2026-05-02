import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  ListTheaterScheduleQuery,
  ListTheatersQuery,
  MovieTheaterSummaryDto,
  TheaterListResultDto,
  TheaterScheduleMovieDto,
  TheaterScheduleResultDto,
  TheaterScheduleScreeningDto,
  TheaterSummaryDto,
} from '@application/query/dto';
import type { TheaterQueryPort } from '@application/query/ports';
import { MovieEntity, ScreeningEntity, TheaterEntity } from '../entities';

interface TheaterWithDistance {
  theater: TheaterEntity;
  distanceMeters?: number;
}

@Injectable()
@Logging
export class MikroOrmTheaterQueryRepository implements TheaterQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async list(query: ListTheatersQuery): Promise<TheaterListResultDto> {
    const rows = await this.findRows(query);

    return TheaterListResultDto.of({
      items: rows.map((row) => this.toDto(row)),
    });
  }

  async listSchedule(query: ListTheaterScheduleQuery): Promise<TheaterScheduleResultDto> {
    const theater = await this.entityManager.findOne(TheaterEntity, { id: query.theaterId });

    if (theater === null) {
      throw new Error('THEATER_NOT_FOUND');
    }

    const screenings = await this.findScheduleRows(query);

    return TheaterScheduleResultDto.of({
      theater: MovieTheaterSummaryDto.of({
        id: Number(theater.id),
        name: theater.name,
        address: theater.address,
      }),
      date: query.date,
      movies: this.toScheduleMovieDtos(screenings),
    });
  }

  @NoLog
  private async findRows(query: ListTheatersQuery): Promise<TheaterWithDistance[]> {
    const theaters = await this.entityManager.find(TheaterEntity, {}, { orderBy: { id: 'ASC' } });

    if (!query.hasCurrentLocation()) {
      return theaters.map((theater) => ({ theater }));
    }

    return theaters
      .map((theater) => ({
        theater,
        distanceMeters: this.calculateDistanceMeters(query.latitude, query.longitude, theater.latitude, theater.longitude),
      }))
      .sort((left, right) => this.compareDistance(left, right));
  }

  @NoLog
  private calculateDistanceMeters(
    currentLatitude: number | undefined,
    currentLongitude: number | undefined,
    theaterLatitude: number | undefined,
    theaterLongitude: number | undefined,
  ): number | undefined {
    if (
      currentLatitude === undefined ||
      currentLongitude === undefined ||
      theaterLatitude === undefined ||
      theaterLongitude === undefined
    ) {
      return undefined;
    }

    const earthRadiusMeters = 6_371_000;
    const latitudeDelta = this.toRadians(theaterLatitude - currentLatitude);
    const longitudeDelta = this.toRadians(theaterLongitude - currentLongitude);
    const currentLatitudeRadians = this.toRadians(currentLatitude);
    const theaterLatitudeRadians = this.toRadians(theaterLatitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(currentLatitudeRadians) * Math.cos(theaterLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusMeters * 2 * Math.asin(Math.sqrt(haversine));
  }

  @NoLog
  private compareDistance(left: TheaterWithDistance, right: TheaterWithDistance): number {
    if (left.distanceMeters === undefined && right.distanceMeters === undefined) {
      return Number(left.theater.id) - Number(right.theater.id);
    }

    if (left.distanceMeters === undefined) {
      return 1;
    }

    if (right.distanceMeters === undefined) {
      return -1;
    }

    return left.distanceMeters - right.distanceMeters || Number(left.theater.id) - Number(right.theater.id);
  }

  @NoLog
  private toRadians(value: number): number {
    return value * Math.PI / 180;
  }

  @NoLog
  private toDto(row: TheaterWithDistance): TheaterSummaryDto {
    return TheaterSummaryDto.of({
      id: Number(row.theater.id),
      name: row.theater.name,
      address: row.theater.address,
      latitude: row.theater.latitude,
      longitude: row.theater.longitude,
      distanceMeters: row.distanceMeters,
    });
  }

  @NoLog
  private findScheduleRows(query: ListTheaterScheduleQuery): Promise<ScreeningEntity[]> {
    return this.entityManager.find(ScreeningEntity, {
      screen: {
        theater: query.theaterId,
      },
      startAt: {
        $gte: query.startAt,
        $lt: query.endAt,
      },
    }, {
      populate: [
        'movie.images',
        'screen.theater',
        'reservationSeats.reservation',
      ],
      orderBy: {
        movie: { title: 'ASC' },
        startAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  @NoLog
  private toScheduleMovieDtos(screenings: ScreeningEntity[]): TheaterScheduleMovieDto[] {
    const screeningsByMovieId = new Map<string, ScreeningEntity[]>();

    for (const screening of screenings) {
      const movieId = String(screening.movie.id);
      const rows = screeningsByMovieId.get(movieId) ?? [];
      rows.push(screening);
      screeningsByMovieId.set(movieId, rows);
    }

    return Array.from(screeningsByMovieId.values())
      .sort((left, right) => this.compareMovieScheduleGroups(left, right))
      .map((rows) => this.toScheduleMovieDto(rows));
  }

  @NoLog
  private compareMovieScheduleGroups(left: ScreeningEntity[], right: ScreeningEntity[]): number {
    const leftFirst = left[0];
    const rightFirst = right[0];

    return leftFirst.startAt.getTime() - rightFirst.startAt.getTime()
      || leftFirst.movie.title.localeCompare(rightFirst.movie.title)
      || Number(leftFirst.movie.id) - Number(rightFirst.movie.id);
  }

  @NoLog
  private toScheduleMovieDto(screenings: ScreeningEntity[]): TheaterScheduleMovieDto {
    const movie = screenings[0].movie;

    return TheaterScheduleMovieDto.of({
      id: Number(movie.id),
      title: movie.title,
      genre: movie.genre ?? '',
      rating: movie.rating ?? '',
      runningTime: movie.runningTime,
      posterUrl: this.posterUrl(movie) ?? '',
      screenings: screenings
        .sort((left, right) => left.startAt.getTime() - right.startAt.getTime() || Number(left.id) - Number(right.id))
        .map((screening) => this.toScheduleScreeningDto(screening)),
    });
  }

  @NoLog
  private toScheduleScreeningDto(screening: ScreeningEntity): TheaterScheduleScreeningDto {
    const reservedSeatCount = screening.reservationSeats
      .getItems()
      .filter((reservationSeat) => reservationSeat.reservation.status === 'CONFIRMED').length;

    return TheaterScheduleScreeningDto.of({
      id: Number(screening.id),
      screenName: screening.screen.name,
      startAt: screening.startAt.toISOString(),
      endAt: screening.endAt.toISOString(),
      remainingSeats: Math.max(screening.screen.totalSeats - reservedSeatCount, 0),
      totalSeats: screening.screen.totalSeats,
      price: screening.price,
    });
  }

  @NoLog
  private posterUrl(movie: MovieEntity): string | undefined {
    const poster = movie.images
      .getItems()
      .filter((image) => image.imageType === 'POSTER')
      .sort((left, right) => left.sortOrder - right.sortOrder || Number(left.id) - Number(right.id))[0];

    return poster?.url ?? movie.posterUrl;
  }
}
