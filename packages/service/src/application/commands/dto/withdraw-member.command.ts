export class WithdrawMemberCommand {
  private constructor(readonly memberId: string) {}

  static of(params: { memberId: string }): WithdrawMemberCommand {
    return new WithdrawMemberCommand(params.memberId);
  }
}
