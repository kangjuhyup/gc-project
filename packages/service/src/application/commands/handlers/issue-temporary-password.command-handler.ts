import { Logging } from '@kangjuhyup/rvlog';
import { assertDefined, assertTrue } from '@application/assertions';
import { IssueTemporaryPasswordCommand, TemporaryPasswordIssuedDto } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  MemberRepositoryPort,
  PasswordHasherPort,
  PhoneVerificationRepositoryPort,
  TemporaryPasswordGeneratorPort,
} from '../ports';

@Logging
export class IssueTemporaryPasswordCommandHandler {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly phoneVerificationRepository: PhoneVerificationRepositoryPort,
    private readonly temporaryPasswordGenerator: TemporaryPasswordGeneratorPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: IssueTemporaryPasswordCommand): Promise<TemporaryPasswordIssuedDto> {
    const member = await this.memberRepository.findByUserId(command.userId);
    assertDefined(member, () => new Error('MEMBER_NOT_FOUND'));

    const verification = await this.phoneVerificationRepository.findById(
      command.phoneVerificationId,
    );
    assertDefined(verification, () => new Error('PHONE_VERIFICATION_REQUIRED'));
    assertTrue(
      verification.phoneNumber === member.phoneNumber && verification.status === 'VERIFIED',
      () => new Error('PHONE_VERIFICATION_REQUIRED'),
    );

    const temporaryPassword = this.temporaryPasswordGenerator.generate();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);

    await this.memberRepository.save(
      member.issueTemporaryPassword({
        passwordHash,
        now: this.clock.now(),
      }),
    );

    return TemporaryPasswordIssuedDto.of({
      userId: member.userId,
      temporaryPassword,
    });
  }
}
