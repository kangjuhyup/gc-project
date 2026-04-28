export class PhoneVerificationIssuedDto {
  private constructor(
    readonly verificationId: string,
    readonly code: string,
    readonly expiresAt: Date,
  ) {}

  static of(params: { verificationId: string; code: string; expiresAt: Date }): PhoneVerificationIssuedDto {
    return new PhoneVerificationIssuedDto(params.verificationId, params.code, params.expiresAt);
  }
}
