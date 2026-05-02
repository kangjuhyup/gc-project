import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListMoviesRequestDto {
  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: 50,
    default: 20,
    description: '커서 페이지 크기',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit?: number;

  @ApiPropertyOptional({
    example: '파묘',
    maxLength: 80,
    description: '영화 제목/장르/등급/설명 검색어',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  readonly keyword?: string;

  @ApiPropertyOptional({
    example: 'eyJkaXN0YW5jZU1zIjoxMjAwMDAwfQ',
    maxLength: 500,
    description: '이전 응답의 nextCursor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly cursor?: string;

  private constructor(params: { limit?: number; keyword?: string; cursor?: string }) {
    Object.assign(this, params);
  }

  static of(params: { limit?: number; keyword?: string; cursor?: string }): ListMoviesRequestDto {
    return new ListMoviesRequestDto(params);
  }
}
