import { Logging } from '@kangjuhyup/rvlog';
import { LogoutMemberCommand, MemberLoggedOutDto } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  TokenRepositoryPort,
} from '../ports';
import { TokenType } from '../ports';

@Logging
export class LogoutMemberCommandHandler {
  constructor(
    private readonly tokenRepository: TokenRepositoryPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: LogoutMemberCommand): Promise<MemberLoggedOutDto> {
    const now = this.clock.now();
    await this.tokenRepository.revokeActiveByMemberId({
      type: TokenType.ACCESS,
      memberId: command.memberId,
      now,
    });
    const revokedRefreshTokenCount = await this.tokenRepository.revokeActiveByMemberId({
      type: TokenType.REFRESH,
      memberId: command.memberId,
      now,
    });

    return MemberLoggedOutDto.of({
      memberId: command.memberId,
      loggedOut: true,
      revokedRefreshTokenCount,
    });
  }
}
