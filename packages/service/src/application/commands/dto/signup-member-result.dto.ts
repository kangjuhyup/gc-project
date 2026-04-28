import { ApiProperty } from '@nestjs/swagger';

export class SignupMemberResultDto {
  @ApiProperty({ example: '1', description: '가입된 회원 PK' })
  readonly memberId: string;

  @ApiProperty({ example: 'movie_user', description: '회원 로그인 ID' })
  readonly userId: string;

  private constructor(
    memberId: string,
    userId: string,
  ) {
    this.memberId = memberId;
    this.userId = userId;
  }

  static of(params: { memberId: string; userId: string }): SignupMemberResultDto {
    return new SignupMemberResultDto(params.memberId, params.userId);
  }
}
