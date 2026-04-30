import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListMyReservationsRequestDto {
  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 50, default: 20, description: '조회할 예매 목록 크기' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly limit?: number;

  @ApiPropertyOptional({ example: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEwOjIwOjAwLjAwMFoiLCJyZXNlcnZhdGlvbklkIjo1MDAxfQ', maxLength: 500, description: '이전 응답의 nextCursor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly cursor?: string;

  private constructor(params?: { limit?: number; cursor?: string }) {
    if (params !== undefined) {
      this.limit = params.limit;
      this.cursor = params.cursor;
    }
  }

  static of(params: { limit?: number; cursor?: string }): ListMyReservationsRequestDto {
    return new ListMyReservationsRequestDto(params);
  }
}
