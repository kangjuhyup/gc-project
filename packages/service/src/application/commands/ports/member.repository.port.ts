import type { MemberModel } from '../../../domain';
import type { RepositoryPort } from './repository.port';

export interface MemberRepositoryPort extends RepositoryPort<MemberModel> {
  findByEmail(email: string): Promise<MemberModel | null>;
}
