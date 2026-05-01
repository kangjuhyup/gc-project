import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetMyReservationRequestDto {
  @ApiProperty({ example: '5001', description: '조회할 예매 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly reservationId!: string;

  private constructor(params?: { reservationId: string }) {
    if (params !== undefined) {
      this.reservationId = params.reservationId;
    }
  }

  static of(params: { reservationId: string }): GetMyReservationRequestDto {
    return new GetMyReservationRequestDto(params);
  }
}
