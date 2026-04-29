import { MaskLog } from '@kangjuhyup/rvlog';
import { ApiProperty } from '@nestjs/swagger';

export class TemporaryPasswordIssuedDto {
  @ApiProperty({ example: 'movie_user', description: '임시비밀번호가 발급된 회원 로그인 ID' })
  readonly userId: string;

  @ApiProperty({ example: 'Temp-abc1231!', description: '휴대전화 인증 후 발급된 임시비밀번호' })
  @MaskLog({ type: 'full' })
  readonly temporaryPassword: string;

  private constructor(
    userId: string,
    temporaryPassword: string,
  ) {
    this.userId = userId;
    this.temporaryPassword = temporaryPassword;
  }

  static of(params: { userId: string; temporaryPassword: string }): TemporaryPasswordIssuedDto {
    return new TemporaryPasswordIssuedDto(params.userId, params.temporaryPassword);
  }
}
