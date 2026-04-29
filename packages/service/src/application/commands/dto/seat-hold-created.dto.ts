import { ApiProperty } from '@nestjs/swagger';

export class SeatHoldCreatedDto {
  @ApiProperty({ example: '101', description: '임시점유 대상 상영 ID' })
  readonly screeningId: string;

  @ApiProperty({ example: ['1001', '1002'], description: '임시점유된 좌석 ID 목록' })
  readonly seatIds: string[];

  @ApiProperty({ example: ['9001', '9002'], description: 'DB에 저장된 좌석별 임시점유 ID 목록' })
  readonly holdIds: string[];

  @ApiProperty({ example: 600, description: '클라이언트에 노출되는 임시점유 TTL(초). 실제 Redis/DB TTL은 결제 콜백 지연을 고려해 더 길게 저장' })
  readonly ttlSeconds: number;

  @ApiProperty({ example: '2026-04-29T01:10:00.000Z', description: '클라이언트 기준 임시점유 만료 시각. 실제 저장 만료 시각은 13분 후' })
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
