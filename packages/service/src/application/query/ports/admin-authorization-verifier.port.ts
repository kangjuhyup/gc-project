import type { AuthenticatedAdminDto } from '../dto';

export const ADMIN_AUTHORIZATION_VERIFIER = Symbol('ADMIN_AUTHORIZATION_VERIFIER');

export interface AdminAuthorizationVerifierPort {
  verify(authorization: string): Promise<AuthenticatedAdminDto>;
}
