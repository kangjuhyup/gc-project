import { MaskLog } from '@kangjuhyup/rvlog';

export class LoginMemberCommand {
  readonly userId: string;

  @MaskLog({ type: 'full' })
  readonly password: string;

  private constructor(params: { userId: string; password: string }) {
    this.userId = params.userId;
    this.password = params.password;
  }

  static of(params: { userId: string; password: string }): LoginMemberCommand {
    return new LoginMemberCommand(params);
  }
}
