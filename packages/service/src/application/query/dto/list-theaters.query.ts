import { MaskLog } from '@kangjuhyup/rvlog';

export class ListTheatersQuery {
  @MaskLog({ type: 'full' })
  readonly latitude?: number;

  @MaskLog({ type: 'full' })
  readonly longitude?: number;

  private constructor(params: {
    latitude?: number;
    longitude?: number;
  }) {
    this.latitude = params.latitude;
    this.longitude = params.longitude;
  }

  static of(params: {
    latitude?: number;
    longitude?: number;
  }): ListTheatersQuery {
    return new ListTheatersQuery(params);
  }

  hasCurrentLocation(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }
}
