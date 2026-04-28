export class ConfirmPhoneVerificationCommand {
  private constructor(
    readonly verificationId: string,
    readonly phoneNumber: string,
    readonly code: string,
  ) {}

  static of(params: {
    verificationId: string;
    phoneNumber: string;
    code: string;
  }): ConfirmPhoneVerificationCommand {
    return new ConfirmPhoneVerificationCommand(params.verificationId, params.phoneNumber, params.code);
  }
}
