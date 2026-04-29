export class LogoutMemberCommand {
  private constructor(readonly memberId: string) {}

  static of(params: { memberId: string }): LogoutMemberCommand {
    return new LogoutMemberCommand(params.memberId);
  }
}
