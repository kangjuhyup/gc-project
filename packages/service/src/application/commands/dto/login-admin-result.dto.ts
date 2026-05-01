import { ApiProperty } from '@nestjs/swagger';

export class LoginAdminResultDto {
  @ApiProperty({ example: 'admin', description: '관리자 ID' })
  readonly adminId: string;

  @ApiProperty({ example: '4bb9e4e4-5d9c-4a46-85c2-83b2b4bb59f7', description: '관리자 API 인증에 사용할 access token' })
  readonly accessToken: string;

  @ApiProperty({ example: '2026-04-29T00:15:00.000Z', description: 'access token 만료 시각' })
  readonly accessTokenExpiresAt: Date;

  private constructor(
    adminId: string,
    accessToken: string,
    accessTokenExpiresAt: Date,
  ) {
    this.adminId = adminId;
    this.accessToken = accessToken;
    this.accessTokenExpiresAt = accessTokenExpiresAt;
  }

  static of(params: {
    adminId: string;
    accessToken: string;
    accessTokenExpiresAt: Date;
  }): LoginAdminResultDto {
    return new LoginAdminResultDto(
      params.adminId,
      params.accessToken,
      params.accessTokenExpiresAt,
    );
  }
}
