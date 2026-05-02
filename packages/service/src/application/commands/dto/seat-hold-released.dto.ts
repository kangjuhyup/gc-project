import { ApiProperty } from '@nestjs/swagger';

export class SeatHoldReleasedDto {
  @ApiProperty({ example: '9001', description: '해제된 좌석 임시점유 ID' })
  readonly holdId: string;

  @ApiProperty({ example: true, description: '좌석 임시점유 해제 성공 여부' })
  readonly released: boolean;

  private constructor(holdId: string, released: boolean) {
    this.holdId = holdId;
    this.released = released;
  }

  static of(params: { holdId: string; released: boolean }): SeatHoldReleasedDto {
    return new SeatHoldReleasedDto(params.holdId, params.released);
  }
}
