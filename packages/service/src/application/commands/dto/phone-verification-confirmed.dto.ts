import { ApiProperty } from '@nestjs/swagger';

export class PhoneVerificationConfirmedDto {
  @ApiProperty({ example: true, description: '휴대전화 인증 완료 여부' })
  readonly verified: boolean;

  private constructor(verified: boolean) {
    this.verified = verified;
  }

  static of(params: { verified: boolean }): PhoneVerificationConfirmedDto {
    return new PhoneVerificationConfirmedDto(params.verified);
  }
}
