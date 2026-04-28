import type { MemberModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const MEMBER_REPOSITORY = Symbol('MEMBER_REPOSITORY');

export interface MemberRepositoryPort extends RepositoryPort<MemberModel> {
  findByUserId(userId: string): Promise<MemberModel | undefined>;
  findByPhoneNumber(phoneNumber: string): Promise<MemberModel | undefined>;
  existsByUserId(userId: string): Promise<boolean>;
}
