import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, Matches, MaxLength } from 'class-validator';

export class CreateSeatHoldRequestDto {
  @ApiProperty({ example: '101', description: '좌석을 임시점유할 상영 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  readonly screeningId!: string;

  @ApiProperty({
    example: ['1001', '1002'],
    minItems: 1,
    maxItems: 8,
    description: '임시점유할 좌석 ID 목록. 중복 좌석은 허용하지 않음',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @Matches(/^[1-9][0-9]*$/, { each: true })
  @MaxLength(20, { each: true })
  readonly seatIds!: string[];

  private constructor(params: {
    screeningId: string;
    seatIds: string[];
  }) {
    this.screeningId = params.screeningId;
    this.seatIds = params.seatIds;
  }

  static of(params: {
    screeningId: string;
    seatIds: string[];
  }): CreateSeatHoldRequestDto {
    return new CreateSeatHoldRequestDto(params);
  }
}
