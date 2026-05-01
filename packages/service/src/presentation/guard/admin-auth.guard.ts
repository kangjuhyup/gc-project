import { Logging } from '@kangjuhyup/rvlog';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ADMIN_AUTHORIZATION_VERIFIER,
  type AdminAuthorizationVerifierPort,
} from '@application/query/ports';
import type { AuthenticatedAdminDto } from '@application/query/dto';

export interface HttpRequestWithAuthenticatedAdmin {
  headers: {
    authorization?: string | string[];
  };
  admin?: AuthenticatedAdminDto;
}

@Injectable()
@Logging
export class AdminAuthGuard implements CanActivate {
  constructor(
    @Inject(ADMIN_AUTHORIZATION_VERIFIER)
    private readonly authorizationVerifier: AdminAuthorizationVerifierPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<HttpRequestWithAuthenticatedAdmin>();
    const authorization = request.headers.authorization;

    if (authorization === undefined || Array.isArray(authorization) || authorization.trim().length === 0) {
      throw new UnauthorizedException('AUTHORIZATION_REQUIRED');
    }

    try {
      request.admin = await this.authorizationVerifier.verify(authorization);
      return true;
    } catch {
      throw new UnauthorizedException('AUTHORIZATION_INVALID');
    }
  }
}
