import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';
import { MovieRating } from '@domain';

export class CreateMovieRequestDto {
  @ApiProperty({ example: '파묘', minLength: 1, maxLength: 200, description: '영화 제목' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly title!: string;

  @ApiProperty({ example: 134, minimum: 1, maximum: 600, description: '상영 시간(분)' })
  @IsInt()
  @Min(1)
  @Max(600)
  readonly runningTime!: number;

  @ApiPropertyOptional({ example: '장재현', maxLength: 100, description: '감독명' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly director?: string;

  @ApiPropertyOptional({ example: '미스터리', maxLength: 50, description: '장르' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly genre?: string;

  @ApiPropertyOptional({ example: '15', enum: Object.values(MovieRating), description: '관람 등급' })
  @IsOptional()
  @IsIn(Object.values(MovieRating))
  readonly rating?: string;

  @ApiPropertyOptional({ example: '2024-02-22', description: '개봉일' })
  @IsOptional()
  @IsDateString()
  readonly releaseDate?: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/poster.jpg', maxLength: 500, description: '대표 포스터 URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  readonly posterUrl?: string;

  @ApiPropertyOptional({ example: '기묘한 의뢰를 받은 사람들이 오래된 비밀을 마주하는 오컬트 미스터리.', maxLength: 2000, description: '영화 설명' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly description?: string;

  private constructor(params: {
    title: string;
    runningTime: number;
    director?: string;
    genre?: string;
    rating?: string;
    releaseDate?: string;
    posterUrl?: string;
    description?: string;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    title: string;
    runningTime: number;
    director?: string;
    genre?: string;
    rating?: string;
    releaseDate?: string;
    posterUrl?: string;
    description?: string;
  }): CreateMovieRequestDto {
    return new CreateMovieRequestDto(params);
  }
}
