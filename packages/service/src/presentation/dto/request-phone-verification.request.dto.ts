import { IsString, Matches } from 'class-validator';

export class RequestPhoneVerificationRequestDto {
  @IsString()
  @Matches(/^\d{10,11}$/)
  readonly phoneNumber!: string;

  private constructor(params: { phoneNumber: string }) {
    Object.assign(this, params);
  }

  static of(params: { phoneNumber: string }): RequestPhoneVerificationRequestDto {
    return new RequestPhoneVerificationRequestDto(params);
  }
}
