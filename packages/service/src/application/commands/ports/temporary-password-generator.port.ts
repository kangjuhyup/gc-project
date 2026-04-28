export const TEMPORARY_PASSWORD_GENERATOR = Symbol('TEMPORARY_PASSWORD_GENERATOR');

export interface TemporaryPasswordGeneratorPort {
  generate(): string;
}
