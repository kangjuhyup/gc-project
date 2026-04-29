import { Injectable } from '@nestjs/common';
import { AuthenticatedUserDto } from '@application/query/dto';
import type { AuthorizationVerifierPort } from '@application/query/ports';
import type { MemberRepositoryPort } from '@application/commands/ports';

@Injectable()
export class MemberIdAuthorizationVerifier implements AuthorizationVerifierPort {
  constructor(private readonly memberRepository: MemberRepositoryPort) {}

  async verify(authorization: string): Promise<AuthenticatedUserDto> {
    const memberId = this.extractMemberId(authorization);
    const member = await this.memberRepository.findById(memberId);

    if (member === undefined) {
      throw new Error('AUTHORIZATION_INVALID');
    }

    return AuthenticatedUserDto.of({
      memberId: member.id,
      userId: member.userId,
    });
  }

  private extractMemberId(authorization: string): string {
    const [scheme, credentials] = authorization.trim().split(/\s+/, 2);

    if (scheme?.toLowerCase() === 'bearer' && credentials !== undefined) {
      return credentials;
    }

    return authorization.trim();
  }
}
