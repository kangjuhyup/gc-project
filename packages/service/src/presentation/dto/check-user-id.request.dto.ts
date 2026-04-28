import { IsString, Matches } from 'class-validator';

export class CheckUserIdRequestDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  private constructor(params: { userId: string }) {
    Object.assign(this, params);
  }

  static of(params: { userId: string }): CheckUserIdRequestDto {
    return new CheckUserIdRequestDto(params);
  }
}
