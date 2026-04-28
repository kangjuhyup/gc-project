import { IsDateString, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupMemberRequestDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  readonly password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly name!: string;

  @IsDateString()
  readonly birthDate!: string;

  @IsString()
  @Matches(/^\d{10,11}$/)
  readonly phoneNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  readonly address!: string;

  @IsString()
  readonly phoneVerificationId!: string;

  private constructor(params: {
    userId: string;
    password: string;
    name: string;
    birthDate: string;
    phoneNumber: string;
    address: string;
    phoneVerificationId: string;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    userId: string;
    password: string;
    name: string;
    birthDate: string;
    phoneNumber: string;
    address: string;
    phoneVerificationId: string;
  }): SignupMemberRequestDto {
    return new SignupMemberRequestDto(params);
  }
}
