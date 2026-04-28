export class PhoneVerificationConfirmedDto {
  private constructor(readonly verified: boolean) {}

  static of(params: { verified: boolean }): PhoneVerificationConfirmedDto {
    return new PhoneVerificationConfirmedDto(params.verified);
  }
}
