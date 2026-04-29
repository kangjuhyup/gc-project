export const OPAQUE_TOKEN_GENERATOR = Symbol('OPAQUE_TOKEN_GENERATOR');

export interface OpaqueTokenGeneratorPort {
  generate(): string;
}
