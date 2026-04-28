import { MemberModel } from '@domain';
import { SignupMemberCommand, SignupMemberResultDto } from '../dto';
import type {
  MemberRepositoryPort,
  PhoneVerificationRepositoryPort,
} from '../ports';

export class SignupMemberCommandHandler {
  constructor(
    private readonly memberRepository: MemberRepositoryPort,
    private readonly phoneVerificationRepository: PhoneVerificationRepositoryPort,
  ) {}

  async execute(command: SignupMemberCommand): Promise<SignupMemberResultDto> {
    if (await this.memberRepository.existsByUserId(command.userId)) {
      throw new Error('USER_ID_ALREADY_EXISTS');
    }

    if ((await this.memberRepository.findByPhoneNumber(command.phoneNumber)) !== undefined) {
      throw new Error('PHONE_NUMBER_ALREADY_EXISTS');
    }

    const verification = await this.phoneVerificationRepository.findById(command.phoneVerificationId);

    if (
      verification === undefined ||
      verification.phoneNumber !== command.phoneNumber ||
      verification.status !== 'VERIFIED'
    ) {
      throw new Error('PHONE_VERIFICATION_REQUIRED');
    }

    const member = MemberModel.register({
      userId: command.userId,
      name: command.name,
      birthDate: command.birthDate,
      phoneNumber: command.phoneNumber,
      address: command.address,
    });

    const saved = await this.memberRepository.save(member);

    return SignupMemberResultDto.of({
      memberId: saved.id,
      userId: saved.userId,
    });
  }
}
