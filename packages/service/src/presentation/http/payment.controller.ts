import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CommandBus,
  GetPaymentQuery,
  HandlePaymentCallbackCommand,
  PaymentCallbackResultDto,
  PaymentRefundResultDto,
  PaymentResultDto,
  QueryBus,
  RefundPaymentCommand,
  RequestPaymentCommand,
} from '@application';
import { AuthenticatedUserDto } from '@application/query/dto';
import { User } from '@presentation/decorator';
import { MemberAuthGuard } from '@presentation/guard';
import {
  GetPaymentRequestDto,
  HandlePaymentCallbackRequestDto,
  RefundPaymentRequestDto,
  RequestPaymentRequestDto,
} from '../dto';

@ApiTags('Payments')
@Controller('/payments')
export class PaymentController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: '결제 요청',
    description:
      '인증된 회원이 자신이 점유한 좌석 임시점유를 기준으로 결제를 요청합니다. 결제 요청은 이벤트 로그와 outbox 이벤트로 기록됩니다.',
  })
  @ApiCreatedResponse({ type: PaymentResultDto, description: '결제 요청 생성 결과' })
  @ApiBadRequestResponse({ description: '요청 금액/provider/좌석 임시점유 상태가 유효하지 않은 경우' })
  @ApiForbiddenResponse({ description: '다른 회원이 점유한 좌석 임시점유로 결제를 요청한 경우' })
  @ApiNotFoundResponse({ description: '좌석 임시점유를 찾을 수 없는 경우' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(MemberAuthGuard)
  @Post()
  request(@Body() body: RequestPaymentRequestDto, @User() user: AuthenticatedUserDto) {
    const request = RequestPaymentRequestDto.of(body);
    return this.commandBus.execute(
      RequestPaymentCommand.of({
        memberId: user.memberId,
        seatHoldId: request.seatHoldId,
        idempotencyKey: request.idempotencyKey,
        provider: request.provider,
        amount: request.amount,
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '결제 상세 조회',
    description: '인증된 회원 본인의 결제 상태, provider 결제 ID, 예약 연결 여부를 조회합니다.',
  })
  @ApiOkResponse({ type: PaymentResultDto, description: '결제 상세' })
  @ApiNotFoundResponse({ description: '본인 결제를 찾을 수 없는 경우' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(MemberAuthGuard)
  @Get('/:paymentId')
  get(@Param() params: GetPaymentRequestDto, @User() user: AuthenticatedUserDto) {
    const request = GetPaymentRequestDto.of(params);
    return this.queryBus.execute(
      GetPaymentQuery.of({
        paymentId: request.paymentId,
        memberId: user.memberId,
      }),
    );
  }

  @ApiOperation({
    summary: '결제 provider callback 처리',
    description:
      'PG 또는 local payment adapter callback을 처리합니다. 승인 callback 후 예약 생성, 좌석 확정, 결제 승인을 같은 application flow에서 처리합니다.',
  })
  @ApiCreatedResponse({ type: PaymentCallbackResultDto, description: 'callback 처리 결과' })
  @ApiBadRequestResponse({ description: 'callback 검증 실패, provider 불일치, 승인 금액 불일치 등 처리 불가한 경우' })
  @ApiNotFoundResponse({ description: '결제를 찾을 수 없는 경우' })
  @Post('/callback')
  callback(@Body() body: HandlePaymentCallbackRequestDto) {
    const request = HandlePaymentCallbackRequestDto.of(body);
    return this.commandBus.execute(
      HandlePaymentCallbackCommand.of({
        provider: request.provider,
        providerPaymentId: request.providerPaymentId,
        paymentId: request.paymentId,
        amount: request.amount,
        approved: request.approved,
        failureReason: request.failureReason,
        token: request.token,
      }),
    );
  }

  @ApiOperation({
    summary: '결제 환불 요청',
    description:
      '환불 필요 상태의 결제를 provider adapter를 통해 환불합니다. 환불 결과는 결제 이벤트 로그에 기록됩니다.',
  })
  @ApiCreatedResponse({ type: PaymentRefundResultDto, description: '환불 처리 결과' })
  @ApiBadRequestResponse({ description: '환불 가능한 결제 상태가 아니거나 provider 결제 ID가 없는 경우' })
  @ApiNotFoundResponse({ description: '결제를 찾을 수 없는 경우' })
  @Post('/:paymentId/refund')
  refund(@Param() params: RefundPaymentRequestDto) {
    const request = RefundPaymentRequestDto.of(params);
    return this.commandBus.execute(RefundPaymentCommand.of({ paymentId: request.paymentId }));
  }
}
