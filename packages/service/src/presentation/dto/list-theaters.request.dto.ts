import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ListTheatersRequestDto {
  @ApiPropertyOptional({ example: 37.5005, minimum: -90, maximum: 90, description: '현재 위치 위도. longitude와 함께 전달하면 가까운 영화관 순으로 정렬' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly latitude?: number;

  @ApiPropertyOptional({ example: 127.0364, minimum: -180, maximum: 180, description: '현재 위치 경도. latitude와 함께 전달하면 가까운 영화관 순으로 정렬' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly longitude?: number;

  private constructor(params: {
    latitude?: number;
    longitude?: number;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    latitude?: number;
    longitude?: number;
  }): ListTheatersRequestDto {
    return new ListTheatersRequestDto(params);
  }
}
