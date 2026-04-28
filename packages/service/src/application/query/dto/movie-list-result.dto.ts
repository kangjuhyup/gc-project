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

export class MovieScreeningSummaryDto {
  @ApiProperty({ example: 101, description: '상영 일정 ID' })
  readonly id: number;

  @ApiProperty({ example: '1관', description: '상영관명' })
  readonly screenName: string;

  @ApiProperty({ example: '2026-04-28T01:30:00.000Z', description: '상영 시작 시각' })
  readonly startAt: string;

  @ApiProperty({ example: '2026-04-28T03:44:00.000Z', description: '상영 종료 시각' })
  readonly endAt: string;

  @ApiProperty({ example: 36, description: '예약 가능한 잔여 좌석 수' })
  readonly remainingSeats: number;

  @ApiProperty({ example: 80, description: '상영관 전체 좌석 수' })
  readonly totalSeats: number;

  @ApiProperty({ type: MovieTheaterSummaryDto, description: '상영 극장 정보' })
  readonly theater: MovieTheaterSummaryDto;

  private constructor(params: {
    id: number;
    screenName: string;
    startAt: string;
    endAt: string;
    remainingSeats: number;
    totalSeats: number;
    theater: MovieTheaterSummaryDto;
  }) {
    this.id = params.id;
    this.screenName = params.screenName;
    this.startAt = params.startAt;
    this.endAt = params.endAt;
    this.remainingSeats = params.remainingSeats;
    this.totalSeats = params.totalSeats;
    this.theater = params.theater;
  }

  static of(params: {
    id: number;
    screenName: string;
    startAt: string;
    endAt: string;
    remainingSeats: number;
    totalSeats: number;
    theater: MovieTheaterSummaryDto;
  }): MovieScreeningSummaryDto {
    return new MovieScreeningSummaryDto(params);
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

  @ApiProperty({ type: [MovieScreeningSummaryDto], description: '기준 시간과 가장 가까운 상영 목록' })
  readonly screenings: MovieScreeningSummaryDto[];

  private constructor(params: {
    id: number;
    title: string;
    genre: string;
    rating: string;
    runningTime: number;
    releaseDate: string;
    posterUrl: string;
    description: string;
    screenings: MovieScreeningSummaryDto[];
  }) {
    this.id = params.id;
    this.title = params.title;
    this.genre = params.genre;
    this.rating = params.rating;
    this.runningTime = params.runningTime;
    this.releaseDate = params.releaseDate;
    this.posterUrl = params.posterUrl;
    this.description = params.description;
    this.screenings = params.screenings;
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
    screenings: MovieScreeningSummaryDto[];
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
