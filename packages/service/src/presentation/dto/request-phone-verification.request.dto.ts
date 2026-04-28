import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RequestPhoneVerificationRequestDto {
  @ApiProperty({ example: '01012345678', pattern: '^\\d{10,11}$', description: '인증 코드를 발급할 휴대전화번호' })
  @IsString()
  @Matches(/^\d{10,11}$/)
  readonly phoneNumber!: string;

  private constructor(params: { phoneNumber: string }) {
    Object.assign(this, params);
  }

  static of(params: { phoneNumber: string }): RequestPhoneVerificationRequestDto {
    return new RequestPhoneVerificationRequestDto(params);
  }
}
