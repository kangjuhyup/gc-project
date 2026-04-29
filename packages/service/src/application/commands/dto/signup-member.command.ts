import { MaskLog } from '@kangjuhyup/rvlog';

export class SignupMemberCommand {
  readonly userId: string;

  @MaskLog({ type: 'full' })
  readonly password: string;

  @MaskLog({ type: 'name' })
  readonly name: string;

  @MaskLog({ type: 'full' })
  readonly birthDate: Date;

  @MaskLog({ type: 'phone' })
  readonly phoneNumber: string;

  @MaskLog({ type: 'full' })
  readonly address: string;

  readonly phoneVerificationId: string;

  private constructor(params: {
    userId: string;
    password: string;
    name: string;
    birthDate: Date;
    phoneNumber: string;
    address: string;
    phoneVerificationId: string;
  }) {
    this.userId = params.userId;
    this.password = params.password;
    this.name = params.name;
    this.birthDate = params.birthDate;
    this.phoneNumber = params.phoneNumber;
    this.address = params.address;
    this.phoneVerificationId = params.phoneVerificationId;
  }

  static of(params: {
    userId: string;
    password: string;
    name: string;
    birthDate: Date;
    phoneNumber: string;
    address: string;
    phoneVerificationId: string;
  }): SignupMemberCommand {
    return new SignupMemberCommand(params);
  }
}
