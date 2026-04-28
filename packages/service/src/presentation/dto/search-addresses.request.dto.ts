import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SearchAddressesRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  readonly keyword!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly currentPage?: number;

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
