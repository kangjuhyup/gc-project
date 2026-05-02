import { MaskLog } from '@kangjuhyup/rvlog';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginAdminRequestDto {
  @ApiProperty({ example: 'admin', minLength: 1, maxLength: 50, description: '관리자 ID' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly userId!: string;

  @ApiProperty({
    example: 'admin-password123!',
    minLength: 8,
    maxLength: 72,
    description: '관리자 비밀번호',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @MaskLog({ type: 'full' })
  readonly password!: string;

  private constructor(params: { userId: string; password: string }) {
    Object.assign(this, params);
  }

  static of(params: { userId: string; password: string }): LoginAdminRequestDto {
    return new LoginAdminRequestDto(params);
  }
}
