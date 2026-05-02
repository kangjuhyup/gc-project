export class IssueTemporaryPasswordCommand {
  private constructor(
    readonly userId: string,
    readonly phoneVerificationId: string,
  ) {}

  static of(params: {
    userId: string;
    phoneVerificationId: string;
  }): IssueTemporaryPasswordCommand {
    return new IssueTemporaryPasswordCommand(params.userId, params.phoneVerificationId);
  }
}
