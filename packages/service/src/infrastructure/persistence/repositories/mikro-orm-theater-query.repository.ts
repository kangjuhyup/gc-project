import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ListTheatersQuery, TheaterListResultDto, TheaterSummaryDto } from '@application/query/dto';
import type { TheaterQueryPort } from '@application/query/ports';

interface TheaterListRow {
  id: string | number;
  name: string;
  address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  distanceMeters?: string | number | null;
}

@Injectable()
export class MikroOrmTheaterQueryRepository implements TheaterQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async list(query: ListTheatersQuery): Promise<TheaterListResultDto> {
    const rows = query.hasCurrentLocation()
      ? await this.findRowsNearLocation(query.latitude, query.longitude)
      : await this.findRows();

    return TheaterListResultDto.of({
      items: rows.map((row) => this.toDto(row)),
    });
  }

  private findRows(): Promise<TheaterListRow[]> {
    return this.entityManager.execute<TheaterListRow[]>(
      `
        SELECT
          id,
          name,
          address,
          latitude,
          longitude
        FROM theater
        ORDER BY id ASC
      `,
    );
  }

  private findRowsNearLocation(latitude: number | undefined, longitude: number | undefined): Promise<TheaterListRow[]> {
    return this.entityManager.execute<TheaterListRow[]>(
      `
        SELECT
          id,
          name,
          address,
          latitude,
          longitude,
          CASE
            WHEN latitude IS NULL OR longitude IS NULL THEN NULL
            ELSE (
              6371000 * 2 * ASIN(
                SQRT(
                  POWER(SIN(RADIANS((latitude - ?) / 2)), 2)
                  + COS(RADIANS(?))
                    * COS(RADIANS(latitude))
                    * POWER(SIN(RADIANS((longitude - ?) / 2)), 2)
                )
              )
            )
          END AS "distanceMeters"
        FROM theater
        ORDER BY
          CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 ELSE 0 END ASC,
          "distanceMeters" ASC,
          id ASC
      `,
      [latitude, latitude, longitude],
    );
  }

  private toDto(row: TheaterListRow): TheaterSummaryDto {
    return TheaterSummaryDto.of({
      id: Number(row.id),
      name: row.name,
      address: row.address,
      latitude: this.toOptionalNumber(row.latitude),
      longitude: this.toOptionalNumber(row.longitude),
      distanceMeters: this.toOptionalNumber(row.distanceMeters),
    });
  }

  private toOptionalNumber(value: string | number | null | undefined): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  }
}
