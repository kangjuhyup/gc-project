import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MovieCreatedDto {
  @ApiProperty({ example: '1', description: '생성된 영화 ID' })
  readonly movieId: string;

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

  private constructor(params: {
    movieId: string;
    title: string;
    runningTime: number;
    director?: string;
    genre?: string;
    rating?: string;
    releaseDate?: string;
    posterUrl?: string;
    description?: string;
  }) {
    this.movieId = params.movieId;
    this.title = params.title;
    this.runningTime = params.runningTime;
    this.director = params.director;
    this.genre = params.genre;
    this.rating = params.rating;
    this.releaseDate = params.releaseDate;
    this.posterUrl = params.posterUrl;
    this.description = params.description;
  }

  static of(params: {
    movieId: string;
    title: string;
    runningTime: number;
    director?: string;
    genre?: string;
    rating?: string;
    releaseDate?: string;
    posterUrl?: string;
    description?: string;
  }): MovieCreatedDto {
    return new MovieCreatedDto(params);
  }
}
