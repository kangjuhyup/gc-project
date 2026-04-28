import { IsString, Matches } from 'class-validator';

export class ConfirmPhoneVerificationRequestDto {
  @IsString()
  readonly verificationId!: string;

  @IsString()
  @Matches(/^\d{10,11}$/)
  readonly phoneNumber!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  readonly code!: string;

  private constructor(params: { verificationId: string; phoneNumber: string; code: string }) {
    Object.assign(this, params);
  }

  static of(params: {
    verificationId: string;
    phoneNumber: string;
    code: string;
  }): ConfirmPhoneVerificationRequestDto {
    return new ConfirmPhoneVerificationRequestDto(params);
  }
}
