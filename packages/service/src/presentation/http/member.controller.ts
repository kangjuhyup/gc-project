import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ChangeMemberPasswordCommand,
  ChangeMemberPasswordCommandHandler,
  CheckUserIdAvailabilityQuery,
  CheckUserIdAvailabilityQueryHandler,
  ConfirmPhoneVerificationCommand,
  ConfirmPhoneVerificationCommandHandler,
  IssueTemporaryPasswordCommand,
  IssueTemporaryPasswordCommandHandler,
  LoginMemberCommand,
  LoginMemberCommandHandler,
  RequestPhoneVerificationCommand,
  RequestPhoneVerificationCommandHandler,
  SignupMemberCommand,
  SignupMemberCommandHandler,
} from '@application';
import {
  ChangeMemberPasswordRequestDto,
  CheckUserIdRequestDto,
  ConfirmPhoneVerificationRequestDto,
  IssueTemporaryPasswordRequestDto,
  LoginMemberRequestDto,
  RequestPhoneVerificationRequestDto,
  SignupMemberRequestDto,
} from '../dto';

@Controller()
export class MemberController {
  constructor(
    private readonly checkUserIdAvailabilityQueryHandler: CheckUserIdAvailabilityQueryHandler,
    private readonly requestPhoneVerificationCommandHandler: RequestPhoneVerificationCommandHandler,
    private readonly confirmPhoneVerificationCommandHandler: ConfirmPhoneVerificationCommandHandler,
    private readonly signupMemberCommandHandler: SignupMemberCommandHandler,
    private readonly loginMemberCommandHandler: LoginMemberCommandHandler,
    private readonly issueTemporaryPasswordCommandHandler: IssueTemporaryPasswordCommandHandler,
    private readonly changeMemberPasswordCommandHandler: ChangeMemberPasswordCommandHandler,
  ) {}

  @Get('/members/check-user-id')
  checkUserId(@Query() query: CheckUserIdRequestDto) {
    const request = CheckUserIdRequestDto.of(query);
    return this.checkUserIdAvailabilityQueryHandler.execute(
      CheckUserIdAvailabilityQuery.of({ userId: request.userId }),
    );
  }

  @Post('/phone-verifications')
  requestPhoneVerification(@Body() body: RequestPhoneVerificationRequestDto) {
    const request = RequestPhoneVerificationRequestDto.of(body);
    return this.requestPhoneVerificationCommandHandler.execute(
      RequestPhoneVerificationCommand.of({
        phoneNumber: request.phoneNumber,
      }),
    );
  }

  @Post('/phone-verifications/confirm')
  confirmPhoneVerification(@Body() body: ConfirmPhoneVerificationRequestDto) {
    const request = ConfirmPhoneVerificationRequestDto.of(body);
    return this.confirmPhoneVerificationCommandHandler.execute(
      ConfirmPhoneVerificationCommand.of({
        verificationId: request.verificationId,
        phoneNumber: request.phoneNumber,
        code: request.code,
      }),
    );
  }

  @Post('/members/signup')
  signup(@Body() body: SignupMemberRequestDto) {
    const request = SignupMemberRequestDto.of(body);
    return this.signupMemberCommandHandler.execute(
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

  @Post('/members/login')
  login(@Body() body: LoginMemberRequestDto) {
    const request = LoginMemberRequestDto.of(body);
    return this.loginMemberCommandHandler.execute(
      LoginMemberCommand.of({
        userId: request.userId,
        password: request.password,
      }),
    );
  }

  @Post('/members/temporary-password')
  issueTemporaryPassword(@Body() body: IssueTemporaryPasswordRequestDto) {
    const request = IssueTemporaryPasswordRequestDto.of(body);
    return this.issueTemporaryPasswordCommandHandler.execute(
      IssueTemporaryPasswordCommand.of({
        userId: request.userId,
        phoneVerificationId: request.phoneVerificationId,
      }),
    );
  }

  @Post('/members/password')
  changePassword(@Body() body: ChangeMemberPasswordRequestDto) {
    const request = ChangeMemberPasswordRequestDto.of(body);
    return this.changeMemberPasswordCommandHandler.execute(
      ChangeMemberPasswordCommand.of({
        userId: request.userId,
        currentPassword: request.currentPassword,
        newPassword: request.newPassword,
      }),
    );
  }
}
