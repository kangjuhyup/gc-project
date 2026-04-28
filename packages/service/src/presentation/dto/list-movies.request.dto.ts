import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListMoviesRequestDto {
  @IsOptional()
  @IsDateString()
  readonly time?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  readonly keyword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly cursor?: string;

  private constructor(params: {
    time?: string;
    limit?: number;
    keyword?: string;
    cursor?: string;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    time?: string;
    limit?: number;
    keyword?: string;
    cursor?: string;
  }): ListMoviesRequestDto {
    return new ListMoviesRequestDto(params);
  }
}
