export class ListTheatersQuery {
  private constructor(
    readonly latitude?: number,
    readonly longitude?: number,
  ) {}

  static of(params: {
    latitude?: number;
    longitude?: number;
  }): ListTheatersQuery {
    return new ListTheatersQuery(params.latitude, params.longitude);
  }

  hasCurrentLocation(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }
}
