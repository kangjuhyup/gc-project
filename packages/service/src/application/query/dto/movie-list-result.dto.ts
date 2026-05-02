import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MovieTheaterSummaryDto {
  @ApiProperty({ example: 1, description: '극장 ID' })
  readonly id: number;

  @ApiProperty({ example: 'GC 시네마 강남', description: '극장명' })
  readonly name: string;

  @ApiProperty({ example: '서울특별시 강남구 테헤란로 427', description: '극장 주소' })
  readonly address: string;

  private constructor(params: { id: number; name: string; address: string }) {
    this.id = params.id;
    this.name = params.name;
    this.address = params.address;
  }

  static of(params: {
    id: number;
    name: string;
    address: string;
  }): MovieTheaterSummaryDto {
    return new MovieTheaterSummaryDto(params);
  }
}

export class MovieSummaryDto {
  @ApiProperty({ example: 1, description: '영화 ID' })
  readonly id: number;

  @ApiProperty({ example: '파묘', description: '영화 제목' })
  readonly title: string;

  @ApiProperty({ example: '미스터리', description: '장르' })
  readonly genre: string;

  @ApiProperty({ example: '15', description: '관람 등급' })
  readonly rating: string;

  @ApiProperty({ example: 134, description: '상영 시간(분)' })
  readonly runningTime: number;

  @ApiProperty({ example: '2024-02-22', description: '개봉일' })
  readonly releaseDate: string;

  @ApiProperty({ example: 'https://images.example.com/poster.jpg', description: '대표 포스터 URL' })
  readonly posterUrl: string;

  @ApiProperty({ example: '기묘한 의뢰를 받은 사람들이 오래된 비밀을 마주하는 오컬트 미스터리.', description: '영화 설명' })
  readonly description: string;

  private constructor(params: {
    id: number;
    title: string;
    genre: string;
    rating: string;
    runningTime: number;
    releaseDate: string;
    posterUrl: string;
    description: string;
  }) {
    this.id = params.id;
    this.title = params.title;
    this.genre = params.genre;
    this.rating = params.rating;
    this.runningTime = params.runningTime;
    this.releaseDate = params.releaseDate;
    this.posterUrl = params.posterUrl;
    this.description = params.description;
  }

  static of(params: {
    id: number;
    title: string;
    genre: string;
    rating: string;
    runningTime: number;
    releaseDate: string;
    posterUrl: string;
    description: string;
  }): MovieSummaryDto {
    return new MovieSummaryDto(params);
  }
}

export class MovieListResultDto {
  @ApiProperty({ type: [MovieSummaryDto], description: '영화 목록' })
  readonly items: MovieSummaryDto[];

  @ApiProperty({ example: true, description: '다음 페이지 존재 여부' })
  readonly hasNext: boolean;

  @ApiPropertyOptional({ example: 'eyJkaXN0YW5jZU1zIjoxMjAwMDAwfQ', description: '다음 페이지 조회 커서' })
  readonly nextCursor?: string;

  private constructor(params: {
    items: MovieSummaryDto[];
    hasNext: boolean;
    nextCursor?: string;
  }) {
    this.items = params.items;
    this.hasNext = params.hasNext;
    this.nextCursor = params.nextCursor;
  }

  static of(params: {
    items: MovieSummaryDto[];
    hasNext: boolean;
    nextCursor?: string;
  }): MovieListResultDto {
    return new MovieListResultDto(params);
  }
}
