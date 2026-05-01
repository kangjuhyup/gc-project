import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { assertDefined, assertTrue } from '@application/assertions';
import { MemberTokenRefreshedDto, RefreshMemberTokenCommand } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  MemberRepositoryPort,
  OpaqueTokenGeneratorPort,
  TokenRepositoryPort,
} from '../ports';
import { TokenType } from '../ports';

export interface RefreshTokenTtlOptions {
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlSeconds: number;
}

@Logging
export class RefreshMemberTokenCommandHandler {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly opaqueTokenGenerator: OpaqueTokenGeneratorPort,
    private readonly tokenRepository: TokenRepositoryPort,
    private readonly clock: ClockPort,
    private readonly ttlOptions: RefreshTokenTtlOptions,
  ) {}

  @Transactional()
  async execute(command: RefreshMemberTokenCommand): Promise<MemberTokenRefreshedDto> {
    const now = this.clock.now();
    const storedRefreshToken = await this.tokenRepository.findRefreshToken(command.refreshToken);
    assertDefined(storedRefreshToken, () => new Error('INVALID_REFRESH_TOKEN'));
    assertTrue(storedRefreshToken.revokedAt === undefined, () => new Error('INVALID_REFRESH_TOKEN'));
    assertTrue(storedRefreshToken.expiresAt > now, () => new Error('REFRESH_TOKEN_EXPIRED'));

    const member = await this.memberRepository.findById(storedRefreshToken.memberId);
    assertDefined(member, () => new Error('MEMBER_NOT_FOUND'));
    member.assertCanLogin();

    await this.tokenRepository.revokeRefreshToken(storedRefreshToken, now);

    const accessToken = this.opaqueTokenGenerator.generate();
    const refreshToken = this.opaqueTokenGenerator.generate();
    const accessTokenExpiresAt = this.expiresAt(now, this.ttlOptions.accessTokenTtlSeconds);
    const refreshTokenExpiresAt = this.expiresAt(now, this.ttlOptions.refreshTokenTtlSeconds);

    await this.tokenRepository.save({
      type: TokenType.ACCESS,
      subjectId: member.id,
      token: accessToken,
      ttlSeconds: this.ttlOptions.accessTokenTtlSeconds,
      expiresAt: accessTokenExpiresAt,
    });
    await this.tokenRepository.save({
      type: TokenType.REFRESH,
      subjectId: member.id,
      token: refreshToken,
      ttlSeconds: this.ttlOptions.refreshTokenTtlSeconds,
      expiresAt: refreshTokenExpiresAt,
    });

    return MemberTokenRefreshedDto.of({
      memberId: member.id,
      userId: member.userId,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
    });
  }

  @NoLog
  private expiresAt(now: Date, ttlSeconds: number): Date {
    const expiresAt = new Date(now);
    expiresAt.setUTCSeconds(expiresAt.getUTCSeconds() + ttlSeconds);
    return expiresAt;
  }
}
