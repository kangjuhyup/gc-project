import { MaskLog } from '@kangjuhyup/rvlog';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmPhoneVerificationRequestDto {
  @ApiProperty({ example: '1', description: '휴대전화 인증 요청 ID' })
  @IsString()
  readonly verificationId!: string;

  @ApiProperty({
    example: '01012345678',
    pattern: '^\\d{10,11}$',
    description: '인증 대상 휴대전화번호',
  })
  @IsString()
  @Matches(/^\d{10,11}$/)
  @MaskLog({ type: 'phone' })
  readonly phoneNumber!: string;

  @ApiProperty({ example: '123456', pattern: '^\\d{6}$', description: '발급받은 6자리 인증 코드' })
  @IsString()
  @Matches(/^\d{6}$/)
  @MaskLog({ type: 'full' })
  readonly code!: string;

  private constructor(params: { verificationId: string; phoneNumber: string; code: string }) {
    Object.assign(this, params);
  }

  static of(params: {
    verificationId: string;
    phoneNumber: string;
    code: string;
  }): ConfirmPhoneVerificationRequestDto {
    return new ConfirmPhoneVerificationRequestDto(params);
  }
}
