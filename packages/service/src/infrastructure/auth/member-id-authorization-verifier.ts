import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUserDto } from '@application/query/dto';
import { MemberStatus } from '@domain';
import type { AuthorizationVerifierPort } from '@application/query/ports';
import { TokenType, type MemberRepositoryPort, type TokenRepositoryPort } from '@application/commands/ports';

@Injectable()
@Logging
export class MemberIdAuthorizationVerifier implements AuthorizationVerifierPort {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly tokenRepository: TokenRepositoryPort,
  ) {}

  @NoLog
  async verify(authorization: string): Promise<AuthenticatedUserDto> {
    const accessToken = this.extractAccessToken(authorization);
    const memberId = await this.tokenRepository.findMemberId({
      type: TokenType.ACCESS,
      token: accessToken,
    });

    if (memberId === undefined) {
      throw new Error('AUTHORIZATION_INVALID');
    }

    const member = await this.memberRepository.findById(memberId);

    if (member === undefined || member.status === MemberStatus.WITHDRAWN) {
      throw new Error('AUTHORIZATION_INVALID');
    }

    return AuthenticatedUserDto.of({
      memberId: member.id,
      userId: member.userId,
    });
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
