import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ListTheatersQuery, TheaterListResultDto, TheaterSummaryDto } from '@application/query/dto';
import type { TheaterQueryPort } from '@application/query/ports';
import { TheaterEntity } from '../entities';

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
}
