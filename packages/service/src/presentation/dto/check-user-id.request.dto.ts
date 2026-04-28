import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CheckUserIdRequestDto {
  @ApiProperty({
    example: 'movie_user',
    pattern: '^[a-z][a-z0-9_]{3,19}$',
    description: '중복 여부를 확인할 회원 로그인 ID. 소문자로 시작하고 소문자/숫자/_ 조합 4~20자',
  })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  private constructor(params: { userId: string }) {
    Object.assign(this, params);
  }

  static of(params: { userId: string }): CheckUserIdRequestDto {
    return new CheckUserIdRequestDto(params);
  }
}
