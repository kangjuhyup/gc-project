import { MaskLog } from '@kangjuhyup/rvlog';

export class ConfirmPhoneVerificationCommand {
  readonly verificationId: string;

  @MaskLog({ type: 'phone' })
  readonly phoneNumber: string;

  @MaskLog({ type: 'full' })
  readonly code: string;

  private constructor(params: {
    verificationId: string;
    phoneNumber: string;
    code: string;
  }) {
    this.verificationId = params.verificationId;
    this.phoneNumber = params.phoneNumber;
    this.code = params.code;
  }

  static of(params: {
    verificationId: string;
    phoneNumber: string;
    code: string;
  }): ConfirmPhoneVerificationCommand {
    return new ConfirmPhoneVerificationCommand(params);
  }
}
