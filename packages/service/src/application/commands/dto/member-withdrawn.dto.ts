import { ApiProperty } from '@nestjs/swagger';

export class MemberWithdrawnDto {
  @ApiProperty({ example: '1', description: '탈퇴 처리된 회원 ID' })
  readonly memberId: string;

  @ApiProperty({ example: 'movie_user', description: '탈퇴 처리된 회원 로그인 ID' })
  readonly userId: string;

  @ApiProperty({ example: true, description: '회원탈퇴 완료 여부' })
  readonly withdrawn: boolean;

  private constructor(
    memberId: string,
    userId: string,
    withdrawn: boolean,
  ) {
    this.memberId = memberId;
    this.userId = userId;
    this.withdrawn = withdrawn;
  }

  static of(params: { memberId: string; userId: string; withdrawn: boolean }): MemberWithdrawnDto {
    return new MemberWithdrawnDto(params.memberId, params.userId, params.withdrawn);
  }
}
