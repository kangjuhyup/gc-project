export class SignupMemberCommand {
  private constructor(
    readonly userId: string,
    readonly password: string,
    readonly name: string,
    readonly birthDate: Date,
    readonly phoneNumber: string,
    readonly address: string,
    readonly phoneVerificationId: string,
  ) {}

  static of(params: {
    userId: string;
    password: string;
    name: string;
    birthDate: Date;
    phoneNumber: string;
    address: string;
    phoneVerificationId: string;
  }): SignupMemberCommand {
    return new SignupMemberCommand(
      params.userId,
      params.password,
      params.name,
      params.birthDate,
      params.phoneNumber,
      params.address,
      params.phoneVerificationId,
    );
  }
}
