import type { AuthenticatedUserDto } from '../dto';

export const AUTHORIZATION_VERIFIER = Symbol('AUTHORIZATION_VERIFIER');

export interface AuthorizationVerifierPort {
  verify(authorization: string): Promise<AuthenticatedUserDto>;
}
