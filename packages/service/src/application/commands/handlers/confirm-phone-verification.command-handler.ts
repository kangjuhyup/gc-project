import { Logging } from '@kangjuhyup/rvlog';
import {
  ConfirmPhoneVerificationCommand,
  PhoneVerificationConfirmedDto,
} from '../dto';
import { Transactional } from '../decorators';
import type { ClockPort, PhoneVerificationRepositoryPort, TransactionManagerPort } from '../ports';

@Logging
export class ConfirmPhoneVerificationCommandHandler {
  constructor(
    private readonly phoneVerificationRepository: PhoneVerificationRepositoryPort,
    readonly transactionManager: TransactionManagerPort,
    private readonly clock: ClockPort,
  ) {}

  @Transactional()
  async execute(command: ConfirmPhoneVerificationCommand): Promise<PhoneVerificationConfirmedDto> {
    const verification = await this.phoneVerificationRepository.findById(command.verificationId);

    if (verification === undefined) {
      throw new Error('PHONE_VERIFICATION_NOT_FOUND');
    }

    const confirmed = verification.confirm({
      phoneNumber: command.phoneNumber,
      code: command.code,
      now: this.clock.now(),
    });

    await this.phoneVerificationRepository.save(confirmed);

    return PhoneVerificationConfirmedDto.of({ verified: true });
  }
}
