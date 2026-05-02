import { ApiProperty } from '@nestjs/swagger';

export class MemberPasswordChangedDto {
  @ApiProperty({ example: 'movie_user', description: '비밀번호가 변경된 회원 로그인 ID' })
  readonly userId: string;

  @ApiProperty({ example: true, description: '비밀번호 변경 완료 여부' })
  readonly changed: boolean;

  private constructor(userId: string, changed: boolean) {
    this.userId = userId;
    this.changed = changed;
  }

  static of(params: { userId: string; changed: boolean }): MemberPasswordChangedDto {
    return new MemberPasswordChangedDto(params.userId, params.changed);
  }
}
