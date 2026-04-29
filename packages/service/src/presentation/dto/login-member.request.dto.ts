import { MaskLog } from '@kangjuhyup/rvlog';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginMemberRequestDto {
  @ApiProperty({ example: 'movie_user', pattern: '^[a-z][a-z0-9_]{3,19}$', description: '회원 로그인 ID' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  @ApiProperty({ example: 'password123!', minLength: 8, maxLength: 72, description: '회원 비밀번호' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @MaskLog({ type: 'full' })
  readonly password!: string;

  private constructor(params: { userId: string; password: string }) {
    Object.assign(this, params);
  }

  static of(params: { userId: string; password: string }): LoginMemberRequestDto {
    return new LoginMemberRequestDto(params);
  }
}
