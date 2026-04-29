import { MaskLog } from '@kangjuhyup/rvlog';

export class ChangeMemberPasswordCommand {
  readonly userId: string;

  @MaskLog({ type: 'full' })
  readonly currentPassword: string;

  @MaskLog({ type: 'full' })
  readonly newPassword: string;

  private constructor(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) {
    this.userId = params.userId;
    this.currentPassword = params.currentPassword;
    this.newPassword = params.newPassword;
  }

  static of(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): ChangeMemberPasswordCommand {
    return new ChangeMemberPasswordCommand(params);
  }
}
