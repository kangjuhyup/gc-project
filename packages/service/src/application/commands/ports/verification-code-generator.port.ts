export const VERIFICATION_CODE_GENERATOR = Symbol('VERIFICATION_CODE_GENERATOR');

export interface VerificationCodeGeneratorPort {
  generate(): string;
}
