import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, type PaymentStatusType, ReservationStatus, type ReservationStatusType } from '@domain';

export class ReservationSeatSummaryDto {
  @ApiProperty({ example: '1001', description: '예매 좌석 ID' })
  readonly id: string;

  @ApiProperty({ example: 'A', description: '좌석 행' })
  readonly row: string;

  @ApiProperty({ example: 1, description: '좌석 열 번호' })
  readonly col: number;

  @ApiProperty({ example: 'NORMAL', description: '좌석 타입' })
  readonly type: string;

  private constructor(params: { id: string; row: string; col: number; type: string }) {
    this.id = params.id;
    this.row = params.row;
    this.col = params.col;
    this.type = params.type;
  }

  static of(params: { id: string; row: string; col: number; type: string }): ReservationSeatSummaryDto {
    return new ReservationSeatSummaryDto(params);
  }
}

export class ReservationMovieSummaryDto {
  @ApiProperty({ example: '1', description: '영화 ID' })
  readonly id: string;

  @ApiProperty({ example: '파묘', description: '영화 제목' })
  readonly title: string;

  @ApiPropertyOptional({ example: '15', description: '관람 등급' })
  readonly rating?: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/poster.jpg', description: '대표 포스터 URL' })
  readonly posterUrl?: string;

  private constructor(params: { id: string; title: string; rating?: string; posterUrl?: string }) {
    this.id = params.id;
    this.title = params.title;
    this.rating = params.rating;
    this.posterUrl = params.posterUrl;
  }

  static of(params: { id: string; title: string; rating?: string; posterUrl?: string }): ReservationMovieSummaryDto {
    return new ReservationMovieSummaryDto(params);
  }
}

export class ReservationTheaterSummaryDto {
  @ApiProperty({ example: '1', description: '극장 ID' })
  readonly id: string;

  @ApiProperty({ example: 'GC 시네마 강남', description: '극장명' })
  readonly name: string;

  @ApiProperty({ example: '서울특별시 강남구 테헤란로 427', description: '극장 주소' })
  readonly address: string;

  private constructor(params: { id: string; name: string; address: string }) {
    this.id = params.id;
    this.name = params.name;
    this.address = params.address;
  }

  static of(params: { id: string; name: string; address: string }): ReservationTheaterSummaryDto {
    return new ReservationTheaterSummaryDto(params);
  }
}

export class ReservationScreeningSummaryDto {
  @ApiProperty({ example: '101', description: '상영 ID' })
  readonly id: string;

  @ApiProperty({ example: '1관', description: '상영관명' })
  readonly screenName: string;

  @ApiProperty({ example: '2026-04-28T01:30:00.000Z', description: '상영 시작 시각' })
  readonly startAt: string;

  @ApiProperty({ example: '2026-04-28T03:44:00.000Z', description: '상영 종료 시각' })
  readonly endAt: string;

  @ApiProperty({ type: ReservationTheaterSummaryDto, description: '상영 극장 정보' })
  readonly theater: ReservationTheaterSummaryDto;

  private constructor(params: {
    id: string;
    screenName: string;
    startAt: string;
    endAt: string;
    theater: ReservationTheaterSummaryDto;
  }) {
    this.id = params.id;
    this.screenName = params.screenName;
    this.startAt = params.startAt;
    this.endAt = params.endAt;
    this.theater = params.theater;
  }

  static of(params: {
    id: string;
    screenName: string;
    startAt: string;
    endAt: string;
    theater: ReservationTheaterSummaryDto;
  }): ReservationScreeningSummaryDto {
    return new ReservationScreeningSummaryDto(params);
  }
}

export class ReservationPaymentSummaryDto {
  @ApiProperty({ example: '7001', description: '결제 ID' })
  readonly id: string;

  @ApiProperty({ enum: Object.values(PaymentStatus), example: PaymentStatus.APPROVED, description: '결제 상태' })
  readonly status: PaymentStatusType;

  @ApiProperty({ example: 15000, description: '결제 금액' })
  readonly amount: number;

  @ApiPropertyOptional({ example: 'local-payment-7001', description: 'provider 결제 ID' })
  readonly providerPaymentId?: string;

  private constructor(params: {
    id: string;
    status: PaymentStatusType;
    amount: number;
    providerPaymentId?: string;
  }) {
    this.id = params.id;
    this.status = params.status;
    this.amount = params.amount;
    this.providerPaymentId = params.providerPaymentId;
  }

  static of(params: {
    id: string;
    status: PaymentStatusType;
    amount: number;
    providerPaymentId?: string;
  }): ReservationPaymentSummaryDto {
    return new ReservationPaymentSummaryDto(params);
  }
}

export class ReservationSummaryDto {
  @ApiProperty({ example: '5001', description: '예매 ID' })
  readonly id: string;

  @ApiProperty({ example: 'R00000000000005001', description: '예매 번호' })
  readonly reservationNumber: string;

  @ApiProperty({ enum: Object.values(ReservationStatus), example: ReservationStatus.CONFIRMED, description: '예매 상태' })
  readonly status: ReservationStatusType;

  @ApiProperty({ example: 15000, description: '총 결제 금액' })
  readonly totalPrice: number;

  @ApiProperty({ example: '2026-04-30T10:20:00.000Z', description: '예매 생성 시각' })
  readonly createdAt: string;

  @ApiPropertyOptional({ example: '2026-04-30T10:30:00.000Z', description: '예매 취소 시각' })
  readonly canceledAt?: string;

  @ApiPropertyOptional({ example: 'user request', description: '예매 취소 사유' })
  readonly cancelReason?: string;

  @ApiProperty({ type: ReservationMovieSummaryDto, description: '영화 정보' })
  readonly movie: ReservationMovieSummaryDto;

  @ApiProperty({ type: ReservationScreeningSummaryDto, description: '상영 정보' })
  readonly screening: ReservationScreeningSummaryDto;

  @ApiProperty({ type: [ReservationSeatSummaryDto], description: '예매 좌석 목록' })
  readonly seats: ReservationSeatSummaryDto[];

  @ApiPropertyOptional({ type: ReservationPaymentSummaryDto, description: '연결된 결제 정보' })
  readonly payment?: ReservationPaymentSummaryDto;

  private constructor(params: {
    id: string;
    reservationNumber: string;
    status: ReservationStatusType;
    totalPrice: number;
    createdAt: string;
    canceledAt?: string;
    cancelReason?: string;
    movie: ReservationMovieSummaryDto;
    screening: ReservationScreeningSummaryDto;
    seats: ReservationSeatSummaryDto[];
    payment?: ReservationPaymentSummaryDto;
  }) {
    this.id = params.id;
    this.reservationNumber = params.reservationNumber;
    this.status = params.status;
    this.totalPrice = params.totalPrice;
    this.createdAt = params.createdAt;
    this.canceledAt = params.canceledAt;
    this.cancelReason = params.cancelReason;
    this.movie = params.movie;
    this.screening = params.screening;
    this.seats = params.seats;
    this.payment = params.payment;
  }

  static of(params: {
    id: string;
    reservationNumber: string;
    status: ReservationStatusType;
    totalPrice: number;
    createdAt: string;
    canceledAt?: string;
    cancelReason?: string;
    movie: ReservationMovieSummaryDto;
    screening: ReservationScreeningSummaryDto;
    seats: ReservationSeatSummaryDto[];
    payment?: ReservationPaymentSummaryDto;
  }): ReservationSummaryDto {
    return new ReservationSummaryDto(params);
  }
}

export class ReservationDetailDto {
  @ApiProperty({ example: '5001', description: '예매 ID' })
  readonly id: string;

  @ApiProperty({ example: 'R00000000000005001', description: '예매 번호' })
  readonly reservationNumber: string;

  @ApiProperty({ enum: Object.values(ReservationStatus), example: ReservationStatus.CONFIRMED, description: '예매 상태' })
  readonly status: ReservationStatusType;

  @ApiProperty({ example: 15000, description: '총 결제 금액' })
  readonly totalPrice: number;

  @ApiPropertyOptional({ example: 15000, description: '연결된 결제 금액' })
  readonly paymentAmount?: number;

  @ApiProperty({ example: '2026-04-30T10:20:00.000Z', description: '예매 생성 시각' })
  readonly createdAt: string;

  @ApiPropertyOptional({ example: '2026-04-30T10:30:00.000Z', description: '예매 취소 시각' })
  readonly canceledAt?: string;

  @ApiPropertyOptional({ example: 'user request', description: '예매 취소 사유' })
  readonly cancelReason?: string;

  @ApiProperty({ type: ReservationMovieSummaryDto, description: '영화 정보' })
  readonly movie: ReservationMovieSummaryDto;

  @ApiProperty({ type: ReservationScreeningSummaryDto, description: '상영 정보' })
  readonly screening: ReservationScreeningSummaryDto;

  @ApiProperty({ type: [ReservationSeatSummaryDto], description: '예매 좌석 목록' })
  readonly seats: ReservationSeatSummaryDto[];

  @ApiPropertyOptional({ type: ReservationPaymentSummaryDto, description: '연결된 결제 정보' })
  readonly payment?: ReservationPaymentSummaryDto;

  private constructor(params: {
    id: string;
    reservationNumber: string;
    status: ReservationStatusType;
    totalPrice: number;
    paymentAmount?: number;
    createdAt: string;
    canceledAt?: string;
    cancelReason?: string;
    movie: ReservationMovieSummaryDto;
    screening: ReservationScreeningSummaryDto;
    seats: ReservationSeatSummaryDto[];
    payment?: ReservationPaymentSummaryDto;
  }) {
    this.id = params.id;
    this.reservationNumber = params.reservationNumber;
    this.status = params.status;
    this.totalPrice = params.totalPrice;
    this.paymentAmount = params.paymentAmount;
    this.createdAt = params.createdAt;
    this.canceledAt = params.canceledAt;
    this.cancelReason = params.cancelReason;
    this.movie = params.movie;
    this.screening = params.screening;
    this.seats = params.seats;
    this.payment = params.payment;
  }

  static of(params: {
    id: string;
    reservationNumber: string;
    status: ReservationStatusType;
    totalPrice: number;
    paymentAmount?: number;
    createdAt: string;
    canceledAt?: string;
    cancelReason?: string;
    movie: ReservationMovieSummaryDto;
    screening: ReservationScreeningSummaryDto;
    seats: ReservationSeatSummaryDto[];
    payment?: ReservationPaymentSummaryDto;
  }): ReservationDetailDto {
    return new ReservationDetailDto(params);
  }
}

export class ReservationListResultDto {
  @ApiProperty({ type: [ReservationSummaryDto], description: '내 예매 목록' })
  readonly items: ReservationSummaryDto[];

  @ApiProperty({ example: true, description: '다음 페이지 존재 여부' })
  readonly hasNext: boolean;

  @ApiPropertyOptional({ example: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEwOjIwOjAwLjAwMFoiLCJyZXNlcnZhdGlvbklkIjo1MDAxfQ', description: '다음 페이지 조회 커서' })
  readonly nextCursor?: string;

  private constructor(params: {
    items: ReservationSummaryDto[];
    hasNext: boolean;
    nextCursor?: string;
  }) {
    this.items = params.items;
    this.hasNext = params.hasNext;
    this.nextCursor = params.nextCursor;
  }

  static of(params: {
    items: ReservationSummaryDto[];
    hasNext: boolean;
    nextCursor?: string;
  }): ReservationListResultDto {
    return new ReservationListResultDto(params);
  }
}
