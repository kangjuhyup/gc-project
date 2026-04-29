import { Logging } from '@kangjuhyup/rvlog';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AUTHORIZATION_VERIFIER,
  type AuthorizationVerifierPort,
} from '@application/query/ports';
import type { AuthenticatedUserDto } from '@application/query/dto';

export interface HttpRequestWithAuthenticatedUser {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthenticatedUserDto;
}

@Injectable()
@Logging
export class MemberAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTHORIZATION_VERIFIER)
    private readonly authorizationVerifier: AuthorizationVerifierPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<HttpRequestWithAuthenticatedUser>();
    const authorization = request.headers.authorization;

    if (authorization === undefined || Array.isArray(authorization) || authorization.trim().length === 0) {
      throw new UnauthorizedException('AUTHORIZATION_REQUIRED');
    }

    try {
      request.user = await this.authorizationVerifier.verify(authorization);
      return true;
    } catch {
      throw new UnauthorizedException('AUTHORIZATION_INVALID');
    }
  }
}
