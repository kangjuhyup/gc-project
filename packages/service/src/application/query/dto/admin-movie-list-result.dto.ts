import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminMovieSummaryDto {
  @ApiProperty({ example: '1', description: '영화 ID' })
  readonly id: string;

  @ApiProperty({ example: '파묘', description: '영화 제목' })
  readonly title: string;

  @ApiProperty({ example: 134, description: '상영 시간(분)' })
  readonly runningTime: number;

  @ApiPropertyOptional({ example: '장재현', description: '감독명' })
  readonly director?: string;

  @ApiPropertyOptional({ example: '미스터리', description: '장르' })
  readonly genre?: string;

  @ApiPropertyOptional({ example: '15', description: '관람 등급' })
  readonly rating?: string;

  @ApiPropertyOptional({ example: '2024-02-22', description: '개봉일' })
  readonly releaseDate?: string;

  @ApiPropertyOptional({
    example: 'https://images.example.com/poster.jpg',
    description: '대표 포스터 URL',
  })
  readonly posterUrl?: string;

  @ApiPropertyOptional({
    example: '기묘한 의뢰를 받은 사람들이 오래된 비밀을 마주하는 오컬트 미스터리.',
    description: '영화 설명',
  })
  readonly description?: string;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z', description: '등록 시각' })
  readonly createdAt: string;

  private constructor(params: {
    id: string;
    title: string;
    runningTime: number;
    director?: string;
    genre?: string;
    rating?: string;
    releaseDate?: string;
    posterUrl?: string;
    description?: string;
    createdAt: string;
  }) {
    this.id = params.id;
    this.title = params.title;
    this.runningTime = params.runningTime;
    this.director = params.director;
    this.genre = params.genre;
    this.rating = params.rating;
    this.releaseDate = params.releaseDate;
    this.posterUrl = params.posterUrl;
    this.description = params.description;
    this.createdAt = params.createdAt;
  }

  static of(params: {
    id: string;
    title: string;
    runningTime: number;
    director?: string;
    genre?: string;
    rating?: string;
    releaseDate?: string;
    posterUrl?: string;
    description?: string;
    createdAt: string;
  }): AdminMovieSummaryDto {
    return new AdminMovieSummaryDto(params);
  }
}

export class AdminMovieListResultDto {
  @ApiProperty({ example: 10, description: '전체 검색 결과 수' })
  readonly totalCount: number;

  @ApiProperty({ example: 1, description: '현재 페이지 번호' })
  readonly currentPage: number;

  @ApiProperty({ example: 20, description: '페이지당 결과 수' })
  readonly countPerPage: number;

  @ApiProperty({ type: [AdminMovieSummaryDto], description: '관리자 영화 목록' })
  readonly items: AdminMovieSummaryDto[];

  private constructor(params: {
    totalCount: number;
    currentPage: number;
    countPerPage: number;
    items: AdminMovieSummaryDto[];
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
    items: AdminMovieSummaryDto[];
  }): AdminMovieListResultDto {
    return new AdminMovieListResultDto(params);
  }
}
