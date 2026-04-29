import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateSeatHoldCommand, CreateSeatHoldCommandHandler, SeatHoldCreatedDto } from '@application';
import { AuthenticatedUserDto } from '@application/query/dto';
import { User } from '@presentation/decorator';
import { MemberAuthGuard } from '@presentation/guard';
import { CreateSeatHoldRequestDto } from '../dto';

@ApiTags('Seat Holds')
@Controller('/seat-holds')
export class SeatHoldController {
  constructor(private readonly createSeatHoldCommandHandler: CreateSeatHoldCommandHandler) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: '영화 좌석 임시점유',
    description:
      '결제 진입 전 선택 좌석을 임시점유합니다. 응답 TTL은 10분이지만, 결제 콜백 지연을 고려해 Redis와 DB에는 13분 만료 상태로 저장합니다.',
  })
  @ApiCreatedResponse({ type: SeatHoldCreatedDto, description: '좌석 임시점유 생성 결과' })
  @ApiBadRequestResponse({ description: '상영/좌석 파라미터가 유효하지 않거나 상영에 포함되지 않은 좌석인 경우' })
  @ApiConflictResponse({ description: '이미 예약되었거나 다른 임시점유가 활성 상태인 좌석인 경우' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(MemberAuthGuard)
  @Post()
  create(@Body() body: CreateSeatHoldRequestDto, @User() user: AuthenticatedUserDto) {
    const request = CreateSeatHoldRequestDto.of(body);
    return this.createSeatHoldCommandHandler.execute(
      CreateSeatHoldCommand.of({
        memberId: user.memberId,
        screeningId: request.screeningId,
        seatIds: request.seatIds,
      }),
    );
  }
}
