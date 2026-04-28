export class SignupMemberCommand {
  private constructor(
    readonly userId: string,
    readonly name: string,
    readonly birthDate: Date,
    readonly phoneNumber: string,
    readonly address: string,
    readonly phoneVerificationId: string,
  ) {}

  static of(params: {
    userId: string;
    name: string;
    birthDate: Date;
    phoneNumber: string;
    address: string;
    phoneVerificationId: string;
  }): SignupMemberCommand {
    return new SignupMemberCommand(
      params.userId,
      params.name,
      params.birthDate,
      params.phoneNumber,
      params.address,
      params.phoneVerificationId,
    );
  }
}
