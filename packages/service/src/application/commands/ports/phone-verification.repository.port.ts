import type { PhoneVerificationModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const PHONE_VERIFICATION_REPOSITORY = Symbol('PHONE_VERIFICATION_REPOSITORY');

export interface PhoneVerificationRepositoryPort extends RepositoryPort<PhoneVerificationModel> {
  findVerifiedByPhoneNumber(phoneNumber: string): Promise<PhoneVerificationModel | undefined>;
}
