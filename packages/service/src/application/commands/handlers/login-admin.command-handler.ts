import { Logging } from '@kangjuhyup/rvlog';
import { assertTrue } from '@application/assertions';
import { LoginAdminCommand, LoginAdminResultDto } from '../dto';
import type {
  ClockPort,
  OpaqueTokenGeneratorPort,
  TokenRepositoryPort,
} from '../ports';
import { TokenType } from '../ports';

export interface LoginAdminOptions {
  readonly adminId: string;
  readonly password: string;
  readonly accessTokenTtlSeconds: number;
}

@Logging
export class LoginAdminCommandHandler {
  constructor(
    private readonly opaqueTokenGenerator: OpaqueTokenGeneratorPort,
    private readonly tokenRepository: TokenRepositoryPort,
    private readonly clock: ClockPort,
    private readonly options: LoginAdminOptions,
  ) {}

  async execute(command: LoginAdminCommand): Promise<LoginAdminResultDto> {
    assertTrue(
      command.userId === this.options.adminId && command.password === this.options.password,
      () => new Error('INVALID_ADMIN_CREDENTIALS'),
    );

    const accessToken = this.opaqueTokenGenerator.generate();
    const issuedAt = this.clock.now();
    const accessTokenExpiresAt = new Date(issuedAt);
    accessTokenExpiresAt.setUTCSeconds(
      accessTokenExpiresAt.getUTCSeconds() + this.options.accessTokenTtlSeconds,
    );

    await this.tokenRepository.save({
      type: TokenType.ADMIN_ACCESS,
      subjectId: this.options.adminId,
      token: accessToken,
      ttlSeconds: this.options.accessTokenTtlSeconds,
      expiresAt: accessTokenExpiresAt,
    });

    return LoginAdminResultDto.of({
      adminId: this.options.adminId,
      accessToken,
      accessTokenExpiresAt,
    });
  }
}
