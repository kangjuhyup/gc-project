export class RequestPhoneVerificationCommand {
  private constructor(readonly phoneNumber: string) {}

  static of(params: { phoneNumber: string }): RequestPhoneVerificationCommand {
    return new RequestPhoneVerificationCommand(params.phoneNumber);
  }
}
