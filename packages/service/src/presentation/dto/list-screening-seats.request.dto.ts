import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ListScreeningSeatsRequestDto {
  @ApiProperty({ example: '101', description: '좌석 목록을 조회할 상영 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly screeningId!: string;

  private constructor(params: { screeningId: string }) {
    this.screeningId = params.screeningId;
  }

  static of(params: { screeningId: string }): ListScreeningSeatsRequestDto {
    return new ListScreeningSeatsRequestDto(params);
  }
}
