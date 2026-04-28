export class TheaterSummaryDto {
  private constructor(
    readonly id: number,
    readonly name: string,
    readonly address: string,
    readonly latitude?: number,
    readonly longitude?: number,
    readonly distanceMeters?: number,
  ) {}

  static of(params: {
    id: number;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    distanceMeters?: number;
  }): TheaterSummaryDto {
    return new TheaterSummaryDto(
      params.id,
      params.name,
      params.address,
      params.latitude,
      params.longitude,
      params.distanceMeters,
    );
  }
}

export class TheaterListResultDto {
  private constructor(readonly items: TheaterSummaryDto[]) {}

  static of(params: { items: TheaterSummaryDto[] }): TheaterListResultDto {
    return new TheaterListResultDto(params.items);
  }
}
