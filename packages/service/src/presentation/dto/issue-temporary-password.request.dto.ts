import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class IssueTemporaryPasswordRequestDto {
  @ApiProperty({
    example: 'movie_user',
    pattern: '^[a-z][a-z0-9_]{3,19}$',
    description: '임시비밀번호를 발급받을 회원 로그인 ID',
  })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  @ApiProperty({ example: '1', description: '인증 완료된 휴대전화 인증 요청 ID' })
  @IsString()
  readonly phoneVerificationId!: string;

  private constructor(params: { userId: string; phoneVerificationId: string }) {
    Object.assign(this, params);
  }

  static of(params: {
    userId: string;
    phoneVerificationId: string;
  }): IssueTemporaryPasswordRequestDto {
    return new IssueTemporaryPasswordRequestDto(params);
  }
}
