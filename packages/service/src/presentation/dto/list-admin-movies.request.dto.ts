import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListAdminMoviesRequestDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1, description: '현재 페이지 번호' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly currentPage?: number;

  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    description: '페이지당 결과 수',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly countPerPage?: number;

  @ApiPropertyOptional({
    example: '파묘',
    maxLength: 80,
    description: '영화 제목/감독/장르/등급/설명 검색어',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  readonly keyword?: string;

  private constructor(params: { currentPage?: number; countPerPage?: number; keyword?: string }) {
    Object.assign(this, params);
  }

  static of(params: {
    currentPage?: number;
    countPerPage?: number;
    keyword?: string;
  }): ListAdminMoviesRequestDto {
    return new ListAdminMoviesRequestDto(params);
  }
}
