import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginMemberRequestDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  readonly password!: string;

  private constructor(params: { userId: string; password: string }) {
    Object.assign(this, params);
  }

  static of(params: { userId: string; password: string }): LoginMemberRequestDto {
    return new LoginMemberRequestDto(params);
  }
}
