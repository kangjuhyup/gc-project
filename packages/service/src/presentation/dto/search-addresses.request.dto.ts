import { MaskLog } from '@kangjuhyup/rvlog';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SearchAddressesRequestDto {
  @ApiProperty({ example: '테헤란로 427', minLength: 2, maxLength: 80, description: '주소 검색 키워드' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @MaskLog({ type: 'full' })
  readonly keyword!: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1, description: '공공 주소 API 현재 페이지 번호' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly currentPage?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50, default: 10, description: '페이지당 주소 검색 결과 수' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  readonly countPerPage?: number;

  private constructor(params: {
    keyword: string;
    currentPage?: number;
    countPerPage?: number;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    keyword: string;
    currentPage?: number;
    countPerPage?: number;
  }): SearchAddressesRequestDto {
    return new SearchAddressesRequestDto(params);
  }
}
