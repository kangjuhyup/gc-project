import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangeMemberPasswordRequestDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  readonly currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  readonly newPassword!: string;

  private constructor(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): ChangeMemberPasswordRequestDto {
    return new ChangeMemberPasswordRequestDto(params);
  }
}
