import { MaskLog } from '@kangjuhyup/rvlog';

export class RefreshMemberTokenCommand {
  @MaskLog({ type: 'full' })
  readonly refreshToken: string;

  private constructor(params: { refreshToken: string }) {
    this.refreshToken = params.refreshToken;
  }

  static of(params: { refreshToken: string }): RefreshMemberTokenCommand {
    return new RefreshMemberTokenCommand(params);
  }
}
