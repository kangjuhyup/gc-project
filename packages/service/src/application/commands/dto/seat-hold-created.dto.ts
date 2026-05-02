import { ApiProperty } from '@nestjs/swagger';

export class SeatHoldCreatedDto {
  @ApiProperty({ example: '101', description: '임시점유 대상 상영 ID' })
  readonly screeningId: string;

  @ApiProperty({ example: ['1001', '1002'], description: '임시점유된 좌석 ID 목록' })
  readonly seatIds: string[];

  @ApiProperty({ example: ['9001', '9002'], description: 'DB에 저장된 좌석별 임시점유 ID 목록' })
  readonly holdIds: string[];

  @ApiProperty({
    example: 3,
    description: '좌석 임시점유 TTL(초). SEAT_HOLD_TTL_SECONDS 환경변수로 조정',
  })
  readonly ttlSeconds: number;

  @ApiProperty({ example: '2026-04-29T01:00:03.000Z', description: '좌석 임시점유 만료 시각' })
  readonly expiresAt: Date;

  private constructor(
    screeningId: string,
    seatIds: string[],
    holdIds: string[],
    ttlSeconds: number,
    expiresAt: Date,
  ) {
    this.screeningId = screeningId;
    this.seatIds = seatIds;
    this.holdIds = holdIds;
    this.ttlSeconds = ttlSeconds;
    this.expiresAt = expiresAt;
  }

  static of(params: {
    screeningId: string;
    seatIds: string[];
    holdIds: string[];
    ttlSeconds: number;
    expiresAt: Date;
  }): SeatHoldCreatedDto {
    return new SeatHoldCreatedDto(
      params.screeningId,
      params.seatIds,
      params.holdIds,
      params.ttlSeconds,
      params.expiresAt,
    );
  }
}
