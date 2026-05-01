import { Logging } from '@kangjuhyup/rvlog';
import { MemberWithdrawnLogEvent } from '@domain';
import { assertDefined } from '@application/assertions';
import { MemberWithdrawnDto, WithdrawMemberCommand } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  LogEventPublisherPort,
  MemberRepositoryPort,
  TokenRepositoryPort,
} from '../ports';
import { TokenType } from '../ports';

@Logging
export class WithdrawMemberCommandHandler {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly tokenRepository: TokenRepositoryPort,
    private readonly clock: ClockPort,
    private readonly logEventPublisher: LogEventPublisherPort,
  ) {}

  @Transactional()
  async execute(command: WithdrawMemberCommand): Promise<MemberWithdrawnDto> {
    const member = await this.memberRepository.findById(command.memberId);
    assertDefined(member, () => new Error('MEMBER_NOT_FOUND'));

    const occurredAt = this.clock.now();
    const saved = await this.memberRepository.save(member.withdraw(occurredAt));
    await this.tokenRepository.revokeActiveBySubjectId({
      type: TokenType.ACCESS,
      subjectId: saved.id,
      now: occurredAt,
    });
    await this.tokenRepository.revokeActiveBySubjectId({
      type: TokenType.REFRESH,
      subjectId: saved.id,
      now: occurredAt,
    });
    await this.logEventPublisher.publish(
      MemberWithdrawnLogEvent.of({
        memberId: saved.id,
        userId: saved.userId,
        occurredAt,
      }),
    );

    return MemberWithdrawnDto.of({
      memberId: saved.id,
      userId: saved.userId,
      withdrawn: true,
    });
  }
}
