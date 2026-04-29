import { Module } from '@nestjs/common';
import { MEMBER_REPOSITORY, type MemberRepositoryPort } from '@application/commands/ports';
import { AUTHORIZATION_VERIFIER } from '@application/query/ports';
import { PersistenceModule } from '@infrastructure/persistence';
import { MemberIdAuthorizationVerifier } from './member-id-authorization-verifier';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: AUTHORIZATION_VERIFIER,
      useFactory: (memberRepository: MemberRepositoryPort) => new MemberIdAuthorizationVerifier(memberRepository),
      inject: [MEMBER_REPOSITORY],
    },
  ],
  exports: [AUTHORIZATION_VERIFIER],
})
export class AuthModule {}
