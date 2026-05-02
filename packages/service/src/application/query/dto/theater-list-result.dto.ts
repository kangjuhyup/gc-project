import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TheaterSummaryDto {
  @ApiProperty({ example: 1, description: '극장 ID' })
  readonly id: number;

  @ApiProperty({ example: 'GC 시네마 강남', description: '극장명' })
  readonly name: string;

  @ApiProperty({ example: '서울특별시 강남구 테헤란로 427', description: '극장 주소' })
  readonly address: string;

  @ApiPropertyOptional({ example: 37.5065, description: '극장 위도' })
  readonly latitude?: number;

  @ApiPropertyOptional({ example: 127.053, description: '극장 경도' })
  readonly longitude?: number;

  @ApiPropertyOptional({
    example: 120.5,
    description: '현재 위치와의 거리(미터). 현재 위치와 극장 좌표가 모두 있을 때만 제공',
  })
  readonly distanceMeters?: number;

  private constructor(params: {
    id: number;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    distanceMeters?: number;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.address = params.address;
    this.latitude = params.latitude;
    this.longitude = params.longitude;
    this.distanceMeters = params.distanceMeters;
  }

  static of(params: {
    id: number;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    distanceMeters?: number;
  }): TheaterSummaryDto {
    return new TheaterSummaryDto(params);
  }
}

export class TheaterListResultDto {
  @ApiProperty({ type: [TheaterSummaryDto], description: '영화관 목록' })
  readonly items: TheaterSummaryDto[];

  private constructor(params: { items: TheaterSummaryDto[] }) {
    this.items = params.items;
  }

  static of(params: { items: TheaterSummaryDto[] }): TheaterListResultDto {
    return new TheaterListResultDto(params);
  }
}
