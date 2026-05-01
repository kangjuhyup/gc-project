import { Logging } from '@kangjuhyup/rvlog';
import { MemberModel, MemberSignedUpLogEvent } from '@domain';
import { assertDefined, assertTrue } from '@application/assertions';
import { SignupMemberCommand, SignupMemberResultDto } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  LogEventPublisherPort,
  MemberRepositoryPort,
  PasswordHasherPort,
  PhoneVerificationRepositoryPort,
} from '../ports';

@Logging
export class SignupMemberCommandHandler {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly phoneVerificationRepository: PhoneVerificationRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly logEventPublisher: LogEventPublisherPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: SignupMemberCommand): Promise<SignupMemberResultDto> {
    const userIdAvailable = !(await this.memberRepository.existsByUserId(command.userId));
    assertTrue(userIdAvailable, () => new Error('USER_ID_ALREADY_EXISTS'));

    const existingPhoneMember = await this.memberRepository.findByPhoneNumber(command.phoneNumber);
    assertTrue(existingPhoneMember === undefined, () => new Error('PHONE_NUMBER_ALREADY_EXISTS'));

    const verification = await this.phoneVerificationRepository.findById(command.phoneVerificationId);
    assertDefined(verification, () => new Error('PHONE_VERIFICATION_REQUIRED'));
    assertTrue(
      verification.phoneNumber === command.phoneNumber && verification.status === 'VERIFIED',
      () => new Error('PHONE_VERIFICATION_REQUIRED'),
    );

    const passwordHash = await this.passwordHasher.hash(command.password);

    const member = MemberModel.register({
      userId: command.userId,
      passwordHash,
      name: command.name,
      birthDate: command.birthDate,
      phoneNumber: command.phoneNumber,
      address: command.address,
    });

    const saved = await this.memberRepository.save(member);
    await this.logEventPublisher.publish(
      MemberSignedUpLogEvent.of({
        memberId: saved.id,
        userId: saved.userId,
        occurredAt: this.clock.now(),
      }),
    );

    return SignupMemberResultDto.of({
      memberId: saved.id,
      userId: saved.userId,
    });
  }
}
