import { Logging } from '@kangjuhyup/rvlog';
import { PhoneVerificationModel } from '@domain';
import { PhoneVerificationIssuedDto, RequestPhoneVerificationCommand } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  PhoneVerificationRepositoryPort,
  VerificationCodeGeneratorPort,
} from '../ports';

const VERIFICATION_TTL_MS = 5 * 60 * 1000;

@Logging
export class RequestPhoneVerificationCommandHandler {
  constructor(
    private readonly phoneVerificationRepository: PhoneVerificationRepositoryPort,
    private readonly verificationCodeGenerator: VerificationCodeGeneratorPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: RequestPhoneVerificationCommand): Promise<PhoneVerificationIssuedDto> {
    const now = this.clock.now();
    const verification = PhoneVerificationModel.issue({
      phoneNumber: command.phoneNumber,
      code: this.verificationCodeGenerator.generate(),
      expiresAt: new Date(now.getTime() + VERIFICATION_TTL_MS),
    });

    const saved = await this.phoneVerificationRepository.save(verification);

    return PhoneVerificationIssuedDto.of({
      verificationId: saved.id,
      code: saved.code,
      expiresAt: saved.expiresAt,
    });
  }
}
