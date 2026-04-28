export class HealthStatusDto {
  private constructor(
    readonly ok: boolean,
    readonly service: string,
  ) {}

  static of(params: { ok: boolean; service: string }): HealthStatusDto {
    return new HealthStatusDto(params.ok, params.service);
  }
}
