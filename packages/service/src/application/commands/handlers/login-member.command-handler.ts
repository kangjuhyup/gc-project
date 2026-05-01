import { Logging } from '@kangjuhyup/rvlog';
import { LoginFailedLogEvent, LoginSucceededLogEvent, MemberStatus } from '@domain';
import { assertDefined } from '@application/assertions';
import { LoginMemberCommand, LoginMemberResultDto } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  LogEventPublisherPort,
  MemberRepositoryPort,
  OpaqueTokenGeneratorPort,
  PasswordHasherPort,
  TokenRepositoryPort,
} from '../ports';
import { TokenType } from '../ports';

export interface LoginTokenTtlOptions {
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlSeconds: number;
}

@Logging
export class LoginMemberCommandHandler {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
    private readonly logEventPublisher: LogEventPublisherPort,
    private readonly opaqueTokenGenerator: OpaqueTokenGeneratorPort,
    private readonly tokenRepository: TokenRepositoryPort,
    private readonly ttlOptions: LoginTokenTtlOptions,
  ) {}

  @Transactional()
  async execute(command: LoginMemberCommand): Promise<LoginMemberResultDto> {
    const member = await this.memberRepository.findByUserId(command.userId);
    assertDefined(member, () => new Error('INVALID_LOGIN_CREDENTIALS'));
    member.assertCanLogin();

    const passwordMatched = await this.passwordHasher.verify({
      password: command.password,
      passwordHash: member.passwordHash,
    });

    if (!passwordMatched) {
      const occurredAt = this.clock.now();
      const failedMember = await this.memberRepository.save(member.recordLoginFailure(occurredAt));
      await this.logEventPublisher.publish(
        LoginFailedLogEvent.of({
          userId: failedMember.userId,
          failedLoginCount: failedMember.failedLoginCount,
          locked: failedMember.status === MemberStatus.LOCKED,
          occurredAt,
        }),
      );
      throw new Error('INVALID_LOGIN_CREDENTIALS');
    }

    const occurredAt = this.clock.now();
    const loggedInMember = member.failedLoginCount > 0
      ? await this.memberRepository.save(member.recordLoginSuccess(occurredAt))
      : member;
    await this.logEventPublisher.publish(
      LoginSucceededLogEvent.of({
        memberId: loggedInMember.id,
        userId: loggedInMember.userId,
        occurredAt,
      }),
    );
    const accessToken = this.opaqueTokenGenerator.generate();
    const refreshToken = this.opaqueTokenGenerator.generate();
    const accessTokenTtl = this.ttlOptions.accessTokenTtlSeconds;
    const refreshTokenTtl = this.ttlOptions.refreshTokenTtlSeconds;
    const accessTokenExpiresAt = new Date(occurredAt);
    accessTokenExpiresAt.setUTCSeconds(accessTokenExpiresAt.getUTCSeconds() + accessTokenTtl);
    const refreshTokenExpiresAt = new Date(occurredAt);
    refreshTokenExpiresAt.setUTCSeconds(refreshTokenExpiresAt.getUTCSeconds() + refreshTokenTtl);
    await this.tokenRepository.save({
      type: TokenType.ACCESS,
      subjectId: loggedInMember.id,
      token: accessToken,
      ttlSeconds: accessTokenTtl,
      expiresAt: accessTokenExpiresAt,
    });
    await this.tokenRepository.save({
      type: TokenType.REFRESH,
      subjectId: loggedInMember.id,
      token: refreshToken,
      ttlSeconds: refreshTokenTtl,
      expiresAt: refreshTokenExpiresAt,
    });

    return LoginMemberResultDto.of({
      memberId: loggedInMember.id,
      userId: loggedInMember.userId,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
    });
  }
}
