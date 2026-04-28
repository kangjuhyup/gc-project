import { IsString, Matches } from 'class-validator';

export class IssueTemporaryPasswordRequestDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  @IsString()
  readonly phoneVerificationId!: string;

  private constructor(params: { userId: string; phoneVerificationId: string }) {
    Object.assign(this, params);
  }

  static of(params: { userId: string; phoneVerificationId: string }): IssueTemporaryPasswordRequestDto {
    return new IssueTemporaryPasswordRequestDto(params);
  }
}
