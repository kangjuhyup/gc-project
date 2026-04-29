import { ApiProperty } from '@nestjs/swagger';
import { SeatAvailabilityStatus, type SeatAvailabilityStatusType } from '@domain';

export class ScreeningSeatSummaryDto {
  @ApiProperty({ example: '1001', description: '좌석 ID' })
  readonly id: string;

  @ApiProperty({ example: 'A', description: '좌석 행' })
  readonly row: string;

  @ApiProperty({ example: 1, description: '좌석 열 번호' })
  readonly col: number;

  @ApiProperty({ example: 'NORMAL', description: '좌석 타입' })
  readonly type: string;

  @ApiProperty({
    enum: Object.values(SeatAvailabilityStatus),
    example: SeatAvailabilityStatus.AVAILABLE,
    description: '좌석 예매 상태. AVAILABLE=예매 가능, HELD=임시 점유, RESERVED=예매 완료/진행 중',
  })
  readonly status: SeatAvailabilityStatusType;

  private constructor(
    id: string,
    row: string,
    col: number,
    type: string,
    status: SeatAvailabilityStatusType,
  ) {
    this.id = id;
    this.row = row;
    this.col = col;
    this.type = type;
    this.status = status;
  }

  static of(params: {
    id: string;
    row: string;
    col: number;
    type: string;
    status: SeatAvailabilityStatusType;
  }): ScreeningSeatSummaryDto {
    return new ScreeningSeatSummaryDto(params.id, params.row, params.col, params.type, params.status);
  }
}

export class ScreeningSeatListResultDto {
  @ApiProperty({ example: '101', description: '상영 ID' })
  readonly screeningId: string;

  @ApiProperty({ type: [ScreeningSeatSummaryDto], description: '상영관 좌석 목록' })
  readonly seats: ScreeningSeatSummaryDto[];

  private constructor(
    screeningId: string,
    seats: ScreeningSeatSummaryDto[],
  ) {
    this.screeningId = screeningId;
    this.seats = seats;
  }

  static of(params: {
    screeningId: string;
    seats: ScreeningSeatSummaryDto[];
  }): ScreeningSeatListResultDto {
    return new ScreeningSeatListResultDto(params.screeningId, params.seats);
  }
}
