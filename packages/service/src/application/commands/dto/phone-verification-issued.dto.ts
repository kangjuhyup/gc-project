import { MaskLog } from '@kangjuhyup/rvlog';
import { ApiProperty } from '@nestjs/swagger';

export class PhoneVerificationIssuedDto {
  @ApiProperty({ example: '1', description: '휴대전화 인증 요청 ID' })
  readonly verificationId: string;

  @ApiProperty({ example: '123456', description: '개발 환경에서 클라이언트가 확인할 인증 코드' })
  @MaskLog({ type: 'full' })
  readonly code: string;

  @ApiProperty({ example: '2026-04-28T01:05:00.000Z', description: '인증 코드 만료 시각' })
  readonly expiresAt: Date;

  private constructor(verificationId: string, code: string, expiresAt: Date) {
    this.verificationId = verificationId;
    this.code = code;
    this.expiresAt = expiresAt;
  }

  static of(params: {
    verificationId: string;
    code: string;
    expiresAt: Date;
  }): PhoneVerificationIssuedDto {
    return new PhoneVerificationIssuedDto(params.verificationId, params.code, params.expiresAt);
  }
}
