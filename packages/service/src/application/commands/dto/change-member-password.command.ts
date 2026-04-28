export class ChangeMemberPasswordCommand {
  private constructor(
    readonly userId: string,
    readonly currentPassword: string,
    readonly newPassword: string,
  ) {}

  static of(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): ChangeMemberPasswordCommand {
    return new ChangeMemberPasswordCommand(params.userId, params.currentPassword, params.newPassword);
  }
}
