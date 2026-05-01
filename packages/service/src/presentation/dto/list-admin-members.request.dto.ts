import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MemberStatus } from '@domain';

export class ListAdminMembersRequestDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1, description: '현재 페이지 번호' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly currentPage?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20, description: '페이지당 결과 수' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly countPerPage?: number;

  @ApiPropertyOptional({ example: 'movie_user', maxLength: 80, description: '회원 ID/이름/휴대전화번호 검색어' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  readonly keyword?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: Object.values(MemberStatus), description: '회원 상태 필터' })
  @IsOptional()
  @IsIn(Object.values(MemberStatus))
  readonly status?: string;

  private constructor(params: {
    currentPage?: number;
    countPerPage?: number;
    keyword?: string;
    status?: string;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    currentPage?: number;
    countPerPage?: number;
    keyword?: string;
    status?: string;
  }): ListAdminMembersRequestDto {
    return new ListAdminMembersRequestDto(params);
  }
}
