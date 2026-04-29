import { MaskLog } from '@kangjuhyup/rvlog';

export class RequestPhoneVerificationCommand {
  @MaskLog({ type: 'phone' })
  readonly phoneNumber: string;

  private constructor(params: { phoneNumber: string }) {
    this.phoneNumber = params.phoneNumber;
  }

  static of(params: { phoneNumber: string }): RequestPhoneVerificationCommand {
    return new RequestPhoneVerificationCommand(params);
  }
}
