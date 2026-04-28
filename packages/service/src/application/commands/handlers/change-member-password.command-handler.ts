import { MemberPasswordChangedLogEvent } from '@domain';
import { ChangeMemberPasswordCommand, MemberPasswordChangedDto } from '../dto';
import type { ClockPort, LogEventPublisherPort, MemberRepositoryPort, PasswordHasherPort } from '../ports';

export class ChangeMemberPasswordCommandHandler {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
    private readonly logEventPublisher: LogEventPublisherPort,
  ) {}

  async execute(command: ChangeMemberPasswordCommand): Promise<MemberPasswordChangedDto> {
    const member = await this.memberRepository.findByUserId(command.userId);

    if (member === undefined) {
      throw new Error('MEMBER_NOT_FOUND');
    }

    const currentPasswordMatched = await this.passwordHasher.verify({
      password: command.currentPassword,
      passwordHash: member.passwordHash,
    });

    if (!currentPasswordMatched) {
      throw new Error('CURRENT_PASSWORD_MISMATCH');
    }

    const newPasswordHash = await this.passwordHasher.hash(command.newPassword);
    const occurredAt = this.clock.now();
    const saved = await this.memberRepository.save(
      member.changePassword({
        passwordHash: newPasswordHash,
        now: occurredAt,
      }),
    );
    await this.logEventPublisher.publish(
      MemberPasswordChangedLogEvent.of({
        memberId: saved.id,
        userId: saved.userId,
        occurredAt,
      }),
    );

    return MemberPasswordChangedDto.of({
      userId: saved.userId,
      changed: true,
    });
  }
}
