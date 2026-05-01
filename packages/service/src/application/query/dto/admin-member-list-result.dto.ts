import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Privacy } from '../../privacy';

export class AdminMemberSummaryDto {
  @ApiProperty({ example: '1', description: '회원 ID' })
  readonly id: string;

  @ApiProperty({ example: 'movie_user', description: '회원 로그인 ID' })
  readonly userId: string;

  @Privacy({ mask: 'name' })
  @ApiProperty({ example: '홍길동', description: '회원 이름' })
  readonly name: string;

  @Privacy({ mask: 'phoneNumber' })
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
  @ApiProperty({ example: 10, description: '전체 검색 결과 수' })
  readonly totalCount: number;

  @ApiProperty({ example: 1, description: '현재 페이지 번호' })
  readonly currentPage: number;

  @ApiProperty({ example: 20, description: '페이지당 결과 수' })
  readonly countPerPage: number;

  @ApiProperty({ type: [AdminMemberSummaryDto], description: '관리자 회원 목록' })
  readonly items: AdminMemberSummaryDto[];

  private constructor(params: {
    totalCount: number;
    currentPage: number;
    countPerPage: number;
    items: AdminMemberSummaryDto[];
  }) {
    this.totalCount = params.totalCount;
    this.currentPage = params.currentPage;
    this.countPerPage = params.countPerPage;
    this.items = params.items;
  }

  static of(params: {
    totalCount: number;
    currentPage: number;
    countPerPage: number;
    items: AdminMemberSummaryDto[];
  }): AdminMemberListResultDto {
    return new AdminMemberListResultDto(params);
  }
}
