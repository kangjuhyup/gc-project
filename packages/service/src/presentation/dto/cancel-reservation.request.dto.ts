import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelReservationRequestDto {
  @ApiPropertyOptional({ example: 'user request', maxLength: 100, description: '예매 취소 사유' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly reason?: string;

  private constructor(params?: { reason?: string }) {
    if (params !== undefined) {
      this.reason = params.reason;
    }
  }

  static of(params: { reason?: string }): CancelReservationRequestDto {
    return new CancelReservationRequestDto(params);
  }
}
