import { LoginFailedLogEvent, LoginSucceededLogEvent, MemberStatus } from '@domain';
import { LoginMemberCommand, LoginMemberResultDto } from '../dto';
import type { ClockPort, LogEventPublisherPort, MemberRepositoryPort, PasswordHasherPort } from '../ports';

export class LoginMemberCommandHandler {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
    private readonly logEventPublisher: LogEventPublisherPort,
  ) {}

  async execute(command: LoginMemberCommand): Promise<LoginMemberResultDto> {
    const member = await this.memberRepository.findByUserId(command.userId);

    if (member === undefined) {
      throw new Error('INVALID_LOGIN_CREDENTIALS');
    }

    if (member.status === MemberStatus.LOCKED) {
      throw new Error('MEMBER_LOCKED');
    }

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

    return LoginMemberResultDto.of({
      memberId: loggedInMember.id,
      userId: loggedInMember.userId,
    });
  }
}
