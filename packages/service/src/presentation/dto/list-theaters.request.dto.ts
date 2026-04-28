import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ListTheatersRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly latitude?: number;

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
