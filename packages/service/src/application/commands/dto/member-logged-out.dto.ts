import { ApiProperty } from '@nestjs/swagger';

export class MemberLoggedOutDto {
  @ApiProperty({ example: '1', description: '로그아웃된 회원 ID' })
  readonly memberId: string;

  @ApiProperty({ example: true, description: '로그아웃 완료 여부' })
  readonly loggedOut: boolean;

  @ApiProperty({ example: 1, description: '폐기된 refresh token 수' })
  readonly revokedRefreshTokenCount: number;

  private constructor(memberId: string, loggedOut: boolean, revokedRefreshTokenCount: number) {
    this.memberId = memberId;
    this.loggedOut = loggedOut;
    this.revokedRefreshTokenCount = revokedRefreshTokenCount;
  }

  static of(params: {
    memberId: string;
    loggedOut: boolean;
    revokedRefreshTokenCount: number;
  }): MemberLoggedOutDto {
    return new MemberLoggedOutDto(
      params.memberId,
      params.loggedOut,
      params.revokedRefreshTokenCount,
    );
  }
}
