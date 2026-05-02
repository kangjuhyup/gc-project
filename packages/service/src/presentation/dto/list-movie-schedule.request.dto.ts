import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class ListMovieScheduleParamRequestDto {
  @ApiProperty({ example: '1', description: '상영 시간표를 조회할 영화 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly movieId!: string;

  private constructor(params?: { movieId: string }) {
    if (params !== undefined) {
      this.movieId = params.movieId;
    }
  }

  static of(params: { movieId: string }): ListMovieScheduleParamRequestDto {
    return new ListMovieScheduleParamRequestDto(params);
  }
}

export class ListMovieScheduleRequestDto {
  @ApiPropertyOptional({ example: '2026-05-01', description: '조회 일자. 생략 시 KST 기준 오늘' })
  @IsOptional()
  @IsDateString({ strict: true })
  readonly date?: string;

  private constructor(params?: { date?: string }) {
    if (params !== undefined) {
      this.date = params.date;
    }
  }

  static of(params: { date?: string }): ListMovieScheduleRequestDto {
    return new ListMovieScheduleRequestDto(params);
  }
}
