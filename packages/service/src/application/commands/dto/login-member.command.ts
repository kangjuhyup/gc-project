export class LoginMemberCommand {
  private constructor(
    readonly userId: string,
    readonly password: string,
  ) {}

  static of(params: { userId: string; password: string }): LoginMemberCommand {
    return new LoginMemberCommand(params.userId, params.password);
  }
}
