import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CancelReservationCommand,
  CommandBus,
  ListMyReservationsQuery,
  QueryBus,
  ReservationCanceledDto,
  ReservationListResultDto,
} from '@application';
import { AuthenticatedUserDto } from '@application/query/dto';
import { User } from '@presentation/decorator';
import { MemberAuthGuard } from '@presentation/guard';
import { CancelReservationParamRequestDto, CancelReservationRequestDto, ListMyReservationsRequestDto } from '../dto';

@ApiTags('Reservations')
@Controller('/reservations')
export class ReservationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: '내 예매 목록 조회',
    description: '인증된 회원 본인의 예매 목록을 최신순 커서 페이지네이션으로 조회합니다.',
  })
  @ApiOkResponse({ type: ReservationListResultDto, description: '내 예매 목록' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(MemberAuthGuard)
  @Get()
  listMine(@Query() query: ListMyReservationsRequestDto, @User() user: AuthenticatedUserDto) {
    const request = ListMyReservationsRequestDto.of(query);
    return this.queryBus.execute(
      ListMyReservationsQuery.of({
        memberId: user.memberId,
        limit: request.limit,
        cursor: request.cursor,
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '예매 취소',
    description:
      '인증된 회원 본인이 결제 완료한 예매를 취소합니다. 현재 결제 1건은 예약 1건과 연결되므로 예매 전체를 취소하고 환불 요청 이벤트를 outbox에 기록합니다.',
  })
  @ApiCreatedResponse({ type: ReservationCanceledDto, description: '예매 취소 및 환불 요청 결과' })
  @ApiBadRequestResponse({ description: '이미 취소되었거나 결제 완료 상태가 아닌 예매인 경우' })
  @ApiConflictResponse({ description: '동시에 같은 예매를 취소하려는 경우' })
  @ApiForbiddenResponse({ description: '다른 회원의 예매를 취소하려는 경우' })
  @ApiNotFoundResponse({ description: '예매 또는 결제를 찾을 수 없는 경우' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(MemberAuthGuard)
  @Post('/:reservationId/cancel')
  cancel(
    @Param() params: CancelReservationParamRequestDto,
    @Body() body: CancelReservationRequestDto,
    @User() user: AuthenticatedUserDto,
  ) {
    const paramRequest = CancelReservationParamRequestDto.of(params);
    const bodyRequest = CancelReservationRequestDto.of(body);
    return this.commandBus.execute(
      CancelReservationCommand.of({
        memberId: user.memberId,
        reservationId: paramRequest.reservationId,
        reason: bodyRequest.reason,
      }),
    );
  }
}
