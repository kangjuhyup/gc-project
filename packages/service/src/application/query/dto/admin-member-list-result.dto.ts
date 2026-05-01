import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminMemberSummaryDto {
  @ApiProperty({ example: '1', description: '회원 ID' })
  readonly id: string;

  @ApiProperty({ example: 'movie_user', description: '회원 로그인 ID' })
  readonly userId: string;

  @ApiProperty({ example: '홍길동', description: '회원 이름' })
  readonly name: string;

  @ApiProperty({ example: '01000000000', description: '휴대전화번호' })
  readonly phoneNumber: string;

  @ApiProperty({ example: 'ACTIVE', description: '회원 상태' })
  readonly status: string;

  @ApiProperty({ example: 0, description: '로그인 실패 횟수' })
  readonly failedLoginCount: number;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z', description: '잠금 시각' })
  readonly lockedAt?: string;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z', description: '가입 시각' })
  readonly createdAt: string;

  private constructor(params: {
    id: string;
    userId: string;
    name: string;
    phoneNumber: string;
    status: string;
    failedLoginCount: number;
    lockedAt?: string;
    createdAt: string;
  }) {
    this.id = params.id;
    this.userId = params.userId;
    this.name = params.name;
    this.phoneNumber = params.phoneNumber;
    this.status = params.status;
    this.failedLoginCount = params.failedLoginCount;
    this.lockedAt = params.lockedAt;
    this.createdAt = params.createdAt;
  }

  static of(params: {
    id: string;
    userId: string;
    name: string;
    phoneNumber: string;
    status: string;
    failedLoginCount: number;
    lockedAt?: string;
    createdAt: string;
  }): AdminMemberSummaryDto {
    return new AdminMemberSummaryDto(params);
  }
}

export class AdminMemberListResultDto {
  @ApiProperty({ type: [AdminMemberSummaryDto], description: '관리자 회원 목록' })
  readonly items: AdminMemberSummaryDto[];

  @ApiProperty({ example: true, description: '다음 페이지 존재 여부' })
  readonly hasNext: boolean;

  @ApiPropertyOptional({ example: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTAxVDAwOjAwOjAwLjAwMFoifQ', description: '다음 페이지 조회 커서' })
  readonly nextCursor?: string;

  private constructor(params: {
    items: AdminMemberSummaryDto[];
    hasNext: boolean;
    nextCursor?: string;
  }) {
    this.items = params.items;
    this.hasNext = params.hasNext;
    this.nextCursor = params.nextCursor;
  }

  static of(params: {
    items: AdminMemberSummaryDto[];
    hasNext: boolean;
    nextCursor?: string;
  }): AdminMemberListResultDto {
    return new AdminMemberListResultDto(params);
  }
}
