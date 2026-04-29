import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CancelReservationParamRequestDto {
  @ApiProperty({ example: '5001', description: '취소할 예매 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly reservationId!: string;

  private constructor(params?: { reservationId: string }) {
    if (params !== undefined) {
      this.reservationId = params.reservationId;
    }
  }

  static of(params: { reservationId: string }): CancelReservationParamRequestDto {
    return new CancelReservationParamRequestDto(params);
  }
}
