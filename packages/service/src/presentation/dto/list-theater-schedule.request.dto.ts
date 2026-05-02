import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class ListTheaterScheduleParamRequestDto {
  @ApiProperty({ example: '1', description: '상영 시간표를 조회할 영화관 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly theaterId!: string;

  private constructor(params?: { theaterId: string }) {
    if (params !== undefined) {
      this.theaterId = params.theaterId;
    }
  }

  static of(params: { theaterId: string }): ListTheaterScheduleParamRequestDto {
    return new ListTheaterScheduleParamRequestDto(params);
  }
}

export class ListTheaterScheduleRequestDto {
  @ApiPropertyOptional({ example: '2026-05-01', description: '조회 일자. 생략 시 KST 기준 오늘' })
  @IsOptional()
  @IsDateString({ strict: true })
  readonly date?: string;

  private constructor(params?: { date?: string }) {
    if (params !== undefined) {
      this.date = params.date;
    }
  }

  static of(params: { date?: string }): ListTheaterScheduleRequestDto {
    return new ListTheaterScheduleRequestDto(params);
  }
}
