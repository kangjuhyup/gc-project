import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusDto {
  @ApiProperty({ example: true, description: '서비스 정상 동작 여부' })
  readonly ok: boolean;

  @ApiProperty({ example: 'gc-service', description: '서비스 식별자' })
  readonly service: string;

  private constructor(ok: boolean, service: string) {
    this.ok = ok;
    this.service = service;
  }

  static of(params: { ok: boolean; service: string }): HealthStatusDto {
    return new HealthStatusDto(params.ok, params.service);
  }
}
