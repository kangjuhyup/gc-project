import { ApiProperty } from '@nestjs/swagger';
import { MovieTheaterSummaryDto } from './movie-list-result.dto';

export class TheaterScheduleScreeningDto {
  @ApiProperty({ example: 101, description: '상영 일정 ID' })
  readonly id: number;

  @ApiProperty({ example: '1관', description: '상영관명' })
  readonly screenName: string;

  @ApiProperty({ example: '2026-05-01T01:00:00.000Z', description: '상영 시작 시각' })
  readonly startAt: string;

  @ApiProperty({ example: '2026-05-01T03:14:00.000Z', description: '상영 종료 시각' })
  readonly endAt: string;

  @ApiProperty({ example: 36, description: '예약 가능한 잔여 좌석 수' })
  readonly remainingSeats: number;

  @ApiProperty({ example: 80, description: '상영관 전체 좌석 수' })
  readonly totalSeats: number;

  @ApiProperty({ example: 14000, description: '상영 가격' })
  readonly price: number;

  private constructor(params: {
    id: number;
    screenName: string;
    startAt: string;
    endAt: string;
    remainingSeats: number;
    totalSeats: number;
    price: number;
  }) {
    this.id = params.id;
    this.screenName = params.screenName;
    this.startAt = params.startAt;
    this.endAt = params.endAt;
    this.remainingSeats = params.remainingSeats;
    this.totalSeats = params.totalSeats;
    this.price = params.price;
  }

  static of(params: {
    id: number;
    screenName: string;
    startAt: string;
    endAt: string;
    remainingSeats: number;
    totalSeats: number;
    price: number;
  }): TheaterScheduleScreeningDto {
    return new TheaterScheduleScreeningDto(params);
  }
}

export class TheaterScheduleMovieDto {
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

  @ApiProperty({ example: 'https://images.example.com/poster.jpg', description: '대표 포스터 URL' })
  readonly posterUrl: string;

  @ApiProperty({
    type: [TheaterScheduleScreeningDto],
    description: '해당 영화관의 일자별 상영 시간표',
  })
  readonly screenings: TheaterScheduleScreeningDto[];

  private constructor(params: {
    id: number;
    title: string;
    genre: string;
    rating: string;
    runningTime: number;
    posterUrl: string;
    screenings: TheaterScheduleScreeningDto[];
  }) {
    this.id = params.id;
    this.title = params.title;
    this.genre = params.genre;
    this.rating = params.rating;
    this.runningTime = params.runningTime;
    this.posterUrl = params.posterUrl;
    this.screenings = params.screenings;
  }

  static of(params: {
    id: number;
    title: string;
    genre: string;
    rating: string;
    runningTime: number;
    posterUrl: string;
    screenings: TheaterScheduleScreeningDto[];
  }): TheaterScheduleMovieDto {
    return new TheaterScheduleMovieDto(params);
  }
}

export class TheaterScheduleResultDto {
  @ApiProperty({ type: MovieTheaterSummaryDto, description: '상영 시간표를 조회한 영화관' })
  readonly theater: MovieTheaterSummaryDto;

  @ApiProperty({ example: '2026-05-01', description: '조회 일자' })
  readonly date: string;

  @ApiProperty({ type: [TheaterScheduleMovieDto], description: '영화별 상영 시간표' })
  readonly movies: TheaterScheduleMovieDto[];

  private constructor(params: {
    theater: MovieTheaterSummaryDto;
    date: string;
    movies: TheaterScheduleMovieDto[];
  }) {
    this.theater = params.theater;
    this.date = params.date;
    this.movies = params.movies;
  }

  static of(params: {
    theater: MovieTheaterSummaryDto;
    date: string;
    movies: TheaterScheduleMovieDto[];
  }): TheaterScheduleResultDto {
    return new TheaterScheduleResultDto(params);
  }
}
