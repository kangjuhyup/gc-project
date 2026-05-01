import { Module } from '@nestjs/common';
import {
  MEMBER_REPOSITORY,
  TOKEN_REPOSITORY,
  type MemberRepositoryPort,
  type TokenRepositoryPort,
} from '@application/commands/ports';
import { ADMIN_AUTHORIZATION_VERIFIER, AUTHORIZATION_VERIFIER } from '@application/query/ports';
import { CacheModule } from '@infrastructure/cache';
import { PersistenceModule } from '@infrastructure/persistence';
import { AdminAuthorizationVerifier } from './admin-authorization-verifier';
import { MemberIdAuthorizationVerifier } from './member-id-authorization-verifier';
import { RoutingTokenRepository } from './routing-token.repository';

@Module({
  imports: [
    PersistenceModule,
    CacheModule,
  ],
  providers: [
    {
      provide: TOKEN_REPOSITORY,
      useClass: RoutingTokenRepository,
    },
    {
      provide: AUTHORIZATION_VERIFIER,
      useFactory: (
        memberRepository: MemberRepositoryPort,
        tokenRepository: TokenRepositoryPort,
      ) => new MemberIdAuthorizationVerifier(memberRepository, tokenRepository),
      inject: [MEMBER_REPOSITORY, TOKEN_REPOSITORY],
    },
    {
      provide: ADMIN_AUTHORIZATION_VERIFIER,
      useFactory: (tokenRepository: TokenRepositoryPort) =>
        new AdminAuthorizationVerifier(tokenRepository),
      inject: [TOKEN_REPOSITORY],
    },
  ],
  exports: [ADMIN_AUTHORIZATION_VERIFIER, AUTHORIZATION_VERIFIER, TOKEN_REPOSITORY],
})
export class AuthModule {}
