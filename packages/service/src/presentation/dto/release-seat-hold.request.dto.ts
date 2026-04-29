import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ReleaseSeatHoldRequestDto {
  @ApiProperty({ example: '9001', description: '해제할 좌석 임시점유 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly holdId!: string;

  private constructor(params: { holdId: string }) {
    this.holdId = params.holdId;
  }

  static of(params: { holdId: string }): ReleaseSeatHoldRequestDto {
    return new ReleaseSeatHoldRequestDto(params);
  }
}
