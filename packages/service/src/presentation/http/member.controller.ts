import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ChangeMemberPasswordCommand,
  CheckUserIdAvailabilityQuery,
  CommandBus,
  ConfirmPhoneVerificationCommand,
  IssueTemporaryPasswordCommand,
  LoginMemberCommand,
  LoginMemberResultDto,
  LogoutMemberCommand,
  MemberLoggedOutDto,
  MemberPasswordChangedDto,
  MemberTokenRefreshedDto,
  MemberWithdrawnDto,
  PhoneVerificationConfirmedDto,
  PhoneVerificationIssuedDto,
  QueryBus,
  RefreshMemberTokenCommand,
  RequestPhoneVerificationCommand,
  SignupMemberCommand,
  SignupMemberResultDto,
  TemporaryPasswordIssuedDto,
  CheckUserIdAvailabilityResultDto,
  WithdrawMemberCommand,
} from '@application';
import { AuthenticatedUserDto } from '@application/query/dto';
import { User } from '@presentation/decorator';
import { MemberAuthGuard } from '@presentation/guard';
import {
  ChangeMemberPasswordRequestDto,
  CheckUserIdRequestDto,
  ConfirmPhoneVerificationRequestDto,
  IssueTemporaryPasswordRequestDto,
  LoginMemberRequestDto,
  RefreshMemberTokenRequestDto,
  RequestPhoneVerificationRequestDto,
  SignupMemberRequestDto,
} from '../dto';

@ApiTags('Members')
@Controller()
export class MemberController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @ApiOperation({
    summary: '회원 아이디 중복 검사',
    description: '회원가입 전에 userId가 이미 사용 중인지 확인합니다. available=true이면 가입에 사용할 수 있습니다.',
  })
  @ApiOkResponse({ type: CheckUserIdAvailabilityResultDto, description: '회원 아이디 사용 가능 여부' })
  @ApiBadRequestResponse({ description: 'userId 형식이 유효하지 않은 경우' })
  @Get('/members/check-user-id')
  checkUserId(@Query() query: CheckUserIdRequestDto) {
    const request = CheckUserIdRequestDto.of(query);
    return this.queryBus.execute(
      CheckUserIdAvailabilityQuery.of({ userId: request.userId }),
    );
  }

  @ApiOperation({
    summary: '휴대전화 인증 코드 발급',
    description: '휴대전화번호 인증을 시작합니다. 실제 SMS 발송 대신 개발용 인증 코드를 응답으로 반환합니다.',
  })
  @ApiCreatedResponse({ type: PhoneVerificationIssuedDto, description: '휴대전화 인증 코드 발급 완료' })
  @ApiBadRequestResponse({ description: '휴대전화번호 형식이 유효하지 않은 경우' })
  @Post('/phone-verifications')
  requestPhoneVerification(@Body() body: RequestPhoneVerificationRequestDto) {
    const request = RequestPhoneVerificationRequestDto.of(body);
    return this.commandBus.execute(
      RequestPhoneVerificationCommand.of({
        phoneNumber: request.phoneNumber,
      }),
    );
  }

  @ApiOperation({
    summary: '휴대전화 인증 코드 확인',
    description: '발급된 인증 코드와 휴대전화번호를 검증하고 인증을 완료합니다.',
  })
  @ApiCreatedResponse({ type: PhoneVerificationConfirmedDto, description: '휴대전화 인증 확인 결과' })
  @ApiBadRequestResponse({ description: '인증 요청이 없거나, 만료되었거나, 코드가 일치하지 않는 경우' })
  @Post('/phone-verifications/confirm')
  confirmPhoneVerification(@Body() body: ConfirmPhoneVerificationRequestDto) {
    const request = ConfirmPhoneVerificationRequestDto.of(body);
    return this.commandBus.execute(
      ConfirmPhoneVerificationCommand.of({
        verificationId: request.verificationId,
        phoneNumber: request.phoneNumber,
        code: request.code,
      }),
    );
  }

  @ApiOperation({
    summary: '회원가입',
    description: '아이디 중복, 휴대전화 인증 완료 여부를 검증한 뒤 회원을 생성합니다.',
  })
  @ApiCreatedResponse({ type: SignupMemberResultDto, description: '회원가입 완료' })
  @ApiBadRequestResponse({ description: '입력값이 유효하지 않거나 휴대전화 인증이 완료되지 않은 경우' })
  @ApiConflictResponse({ description: '회원 아이디 또는 휴대전화번호가 이미 사용 중인 경우' })
  @Post('/members/signup')
  signup(@Body() body: SignupMemberRequestDto) {
    const request = SignupMemberRequestDto.of(body);
    return this.commandBus.execute(
      SignupMemberCommand.of({
        userId: request.userId,
        password: request.password,
        name: request.name,
        birthDate: new Date(request.birthDate),
        phoneNumber: request.phoneNumber,
        address: request.address,
        phoneVerificationId: request.phoneVerificationId,
      }),
    );
  }

  @ApiOperation({
    summary: '로그인',
    description: '회원 아이디와 비밀번호를 검증합니다. 비밀번호 실패가 5회 누적되면 회원이 잠금 상태가 됩니다.',
  })
  @ApiCreatedResponse({ type: LoginMemberResultDto, description: '로그인 성공' })
  @ApiBadRequestResponse({ description: '아이디/비밀번호가 일치하지 않거나 입력값이 유효하지 않은 경우' })
  @ApiForbiddenResponse({ description: '비밀번호 실패 5회 누적으로 잠긴 회원인 경우' })
  @ApiNotFoundResponse({ description: '회원을 찾을 수 없는 경우' })
  @Post('/members/login')
  login(@Body() body: LoginMemberRequestDto) {
    const request = LoginMemberRequestDto.of(body);
    return this.commandBus.execute(
      LoginMemberCommand.of({
        userId: request.userId,
        password: request.password,
      }),
    );
  }

  @ApiOperation({
    summary: '회원 토큰 재발급',
    description: '유효한 refresh token을 검증하고 기존 refresh token을 폐기한 뒤 새 access token과 refresh token을 발급합니다.',
  })
  @ApiCreatedResponse({ type: MemberTokenRefreshedDto, description: '토큰 재발급 성공' })
  @ApiBadRequestResponse({ description: '입력값이 유효하지 않은 경우' })
  @ApiForbiddenResponse({ description: '잠금 또는 탈퇴 회원인 경우' })
  @ApiNotFoundResponse({ description: '회원을 찾을 수 없는 경우' })
  @ApiUnauthorizedResponse({ description: 'refresh token이 유효하지 않거나 만료된 경우' })
  @Post('/members/token/refresh')
  refreshToken(@Body() body: RefreshMemberTokenRequestDto) {
    const request = RefreshMemberTokenRequestDto.of(body);
    return this.commandBus.execute(
      RefreshMemberTokenCommand.of({
        refreshToken: request.refreshToken,
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '로그아웃',
    description: '인증된 회원의 활성 refresh token을 폐기합니다.',
  })
  @ApiOkResponse({ type: MemberLoggedOutDto, description: '로그아웃 완료' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(MemberAuthGuard)
  @Post('/members/logout')
  logout(@User() user: AuthenticatedUserDto) {
    return this.commandBus.execute(
      LogoutMemberCommand.of({
        memberId: user.memberId,
      }),
    );
  }

  @ApiOperation({
    summary: '임시비밀번호 발급',
    description: '휴대전화 인증이 완료된 회원에게 임시비밀번호를 발급하고 잠금 상태를 해제합니다.',
  })
  @ApiCreatedResponse({ type: TemporaryPasswordIssuedDto, description: '임시비밀번호 발급 완료' })
  @ApiBadRequestResponse({ description: '휴대전화 인증이 완료되지 않았거나 입력값이 유효하지 않은 경우' })
  @ApiNotFoundResponse({ description: '회원을 찾을 수 없는 경우' })
  @Post('/members/temporary-password')
  issueTemporaryPassword(@Body() body: IssueTemporaryPasswordRequestDto) {
    const request = IssueTemporaryPasswordRequestDto.of(body);
    return this.commandBus.execute(
      IssueTemporaryPasswordCommand.of({
        userId: request.userId,
        phoneVerificationId: request.phoneVerificationId,
      }),
    );
  }

  @ApiOperation({
    summary: '비밀번호 변경',
    description: '기존 비밀번호 검증이 통과하면 신규 비밀번호로 변경합니다.',
  })
  @ApiCreatedResponse({ type: MemberPasswordChangedDto, description: '비밀번호 변경 완료' })
  @ApiBadRequestResponse({ description: '기존 비밀번호가 일치하지 않거나 입력값이 유효하지 않은 경우' })
  @ApiNotFoundResponse({ description: '회원을 찾을 수 없는 경우' })
  @Post('/members/password')
  changePassword(@Body() body: ChangeMemberPasswordRequestDto) {
    const request = ChangeMemberPasswordRequestDto.of(body);
    return this.commandBus.execute(
      ChangeMemberPasswordCommand.of({
        userId: request.userId,
        currentPassword: request.currentPassword,
        newPassword: request.newPassword,
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '회원탈퇴',
    description: '인증된 회원 본인을 탈퇴 처리합니다. 탈퇴한 회원은 이후 로그인과 인증 API 사용이 거부됩니다.',
  })
  @ApiOkResponse({ type: MemberWithdrawnDto, description: '회원탈퇴 완료' })
  @ApiConflictResponse({ description: '관람 완료되지 않은 예매가 남아있는 경우' })
  @ApiForbiddenResponse({ description: '이미 탈퇴한 회원인 경우' })
  @ApiNotFoundResponse({ description: '회원을 찾을 수 없는 경우' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(MemberAuthGuard)
  @Delete('/members/me')
  withdraw(@User() user: AuthenticatedUserDto) {
    return this.commandBus.execute(
      WithdrawMemberCommand.of({
        memberId: user.memberId,
      }),
    );
  }
}
