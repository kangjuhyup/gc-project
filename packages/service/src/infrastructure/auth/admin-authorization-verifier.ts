import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import { AuthenticatedAdminDto } from '@application/query/dto';
import { TokenType, type TokenRepositoryPort } from '@application/commands/ports';
import type { AdminAuthorizationVerifierPort } from '@application/query/ports';

@Injectable()
@Logging
export class AdminAuthorizationVerifier implements AdminAuthorizationVerifierPort {
  constructor(private readonly tokenRepository: TokenRepositoryPort) {}

  @NoLog
  async verify(authorization: string): Promise<AuthenticatedAdminDto> {
    const accessToken = this.extractAccessToken(authorization);
    const adminId = await this.tokenRepository.findSubjectId({
      type: TokenType.ADMIN_ACCESS,
      token: accessToken,
    });

    if (adminId === undefined) {
      throw new Error('AUTHORIZATION_INVALID');
    }

    return AuthenticatedAdminDto.of({ adminId });
  }

  @NoLog
  private extractAccessToken(authorization: string): string {
    const [scheme, credentials] = authorization.trim().split(/\s+/, 2);

    if (scheme?.toLowerCase() === 'bearer' && credentials !== undefined) {
      return credentials;
    }

    return authorization.trim();
  }
}
