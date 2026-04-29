import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CommandBus,
  CreateSeatHoldCommand,
  ListScreeningSeatsQuery,
  QueryBus,
  ScreeningSeatListResultDto,
  SeatHoldCreatedDto,
} from '@application';
import { AuthenticatedUserDto } from '@application/query/dto';
import { User } from '@presentation/decorator';
import { MemberAuthGuard } from '@presentation/guard';
import { CreateSeatHoldRequestDto, ListScreeningSeatsRequestDto } from '../dto';

@ApiTags('Seats')
@Controller()
export class SeatController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @ApiOperation({
    summary: '상영 좌석 목록 조회',
    description:
      '상영 ID 기준으로 좌석 목록을 조회합니다. 각 좌석은 AVAILABLE(예매 가능), HELD(임시 점유), RESERVED(예매 완료/진행 중) 상태를 가집니다.',
  })
  @ApiOkResponse({ type: ScreeningSeatListResultDto, description: '상영 좌석 목록' })
  @ApiBadRequestResponse({ description: '상영 ID 형식이 유효하지 않은 경우' })
  @Get('/screenings/:screeningId/seats')
  list(@Param() params: ListScreeningSeatsRequestDto) {
    const request = ListScreeningSeatsRequestDto.of(params);

    return this.queryBus.execute(
      ListScreeningSeatsQuery.of({
        screeningId: request.screeningId,
      }),
    );
  }

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
  @Post('/seat-holds')
  createHold(@Body() body: CreateSeatHoldRequestDto, @User() user: AuthenticatedUserDto) {
    const request = CreateSeatHoldRequestDto.of(body);
    return this.commandBus.execute(
      CreateSeatHoldCommand.of({
        memberId: user.memberId,
        screeningId: request.screeningId,
        seatIds: request.seatIds,
      }),
    );
  }
}
