import { ApiProperty } from '@nestjs/swagger';

export class LoginMemberResultDto {
  @ApiProperty({ example: '1', description: '로그인된 회원 PK' })
  readonly memberId: string;

  @ApiProperty({ example: 'movie_user', description: '회원 로그인 ID' })
  readonly userId: string;

  @ApiProperty({
    example: 'member:1:1d6a6de7-bf58-4f11-8f42-a83ff755b0e8',
    description: 'API 인증에 사용할 access token',
  })
  readonly accessToken: string;

  @ApiProperty({ example: '2026-04-29T00:15:00.000Z', description: 'access token 만료 시각' })
  readonly accessTokenExpiresAt: Date;

  @ApiProperty({
    example: 'b8b6f989-3e5f-4f7b-9c12-41d9f7b0a411',
    description: 'DB에 저장된 refresh token',
  })
  readonly refreshToken: string;

  @ApiProperty({ example: '2026-05-13T00:00:00.000Z', description: 'refresh token 만료 시각' })
  readonly refreshTokenExpiresAt: Date;

  private constructor(
    memberId: string,
    userId: string,
    accessToken: string,
    accessTokenExpiresAt: Date,
    refreshToken: string,
    refreshTokenExpiresAt: Date,
  ) {
    this.memberId = memberId;
    this.userId = userId;
    this.accessToken = accessToken;
    this.accessTokenExpiresAt = accessTokenExpiresAt;
    this.refreshToken = refreshToken;
    this.refreshTokenExpiresAt = refreshTokenExpiresAt;
  }

  static of(params: {
    memberId: string;
    userId: string;
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
  }): LoginMemberResultDto {
    return new LoginMemberResultDto(
      params.memberId,
      params.userId,
      params.accessToken,
      params.accessTokenExpiresAt,
      params.refreshToken,
      params.refreshTokenExpiresAt,
    );
  }
}
