import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CheckUserIdAvailabilityQuery,
  CheckUserIdAvailabilityQueryHandler,
  ConfirmPhoneVerificationCommand,
  ConfirmPhoneVerificationCommandHandler,
  RequestPhoneVerificationCommand,
  RequestPhoneVerificationCommandHandler,
  SignupMemberCommand,
  SignupMemberCommandHandler,
} from '../../application';
import {
  CheckUserIdRequestDto,
  ConfirmPhoneVerificationRequestDto,
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
        name: request.name,
        birthDate: new Date(request.birthDate),
        phoneNumber: request.phoneNumber,
        address: request.address,
        phoneVerificationId: request.phoneVerificationId,
      }),
    );
  }
}
