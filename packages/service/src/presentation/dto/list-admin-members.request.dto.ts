import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MemberStatus } from '@domain';

export class ListAdminMembersRequestDto {
  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20, description: '커서 페이지 크기' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit?: number;

  @ApiPropertyOptional({ example: 'movie_user', maxLength: 80, description: '회원 ID/이름/휴대전화번호 검색어' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  readonly keyword?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: Object.values(MemberStatus), description: '회원 상태 필터' })
  @IsOptional()
  @IsIn(Object.values(MemberStatus))
  readonly status?: string;

  @ApiPropertyOptional({ example: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTAxVDAwOjAwOjAwLjAwMFoifQ', maxLength: 500, description: '이전 응답의 nextCursor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly cursor?: string;

  private constructor(params: {
    limit?: number;
    keyword?: string;
    status?: string;
    cursor?: string;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    limit?: number;
    keyword?: string;
    status?: string;
    cursor?: string;
  }): ListAdminMembersRequestDto {
    return new ListAdminMembersRequestDto(params);
  }
}
