import { MaskLog } from '@kangjuhyup/rvlog';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshMemberTokenRequestDto {
  @ApiProperty({ example: 'b8b6f989-3e5f-4f7b-9c12-41d9f7b0a411', description: '로그인 시 발급받은 refresh token' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @MaskLog({ type: 'full' })
  readonly refreshToken!: string;

  private constructor(params: { refreshToken: string }) {
    Object.assign(this, params);
  }

  static of(params: { refreshToken: string }): RefreshMemberTokenRequestDto {
    return new RefreshMemberTokenRequestDto(params);
  }
}
