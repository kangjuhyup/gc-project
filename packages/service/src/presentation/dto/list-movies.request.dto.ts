import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListMoviesRequestDto {
  @ApiPropertyOptional({
    example: '2026-04-28T10:30:00+09:00',
    description: '영화 목록 정렬 기준 시각. 서버에서 정시 단위로 내림 보정 후 가까운 상영 순으로 정렬',
  })
  @IsOptional()
  @IsDateString()
  readonly time?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 50, default: 20, description: '커서 페이지 크기' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit?: number;

  @ApiPropertyOptional({ example: '파묘', maxLength: 80, description: '영화 제목/장르/등급/설명 검색어' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  readonly keyword?: string;

  @ApiPropertyOptional({ example: 'eyJkaXN0YW5jZU1zIjoxMjAwMDAwfQ', maxLength: 500, description: '이전 응답의 nextCursor' })
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
