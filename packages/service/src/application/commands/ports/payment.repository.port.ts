import type { PaymentModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface PaymentRepositoryPort extends RepositoryPort<PaymentModel> {
  findBySeatHoldId(seatHoldId: string): Promise<PaymentModel | undefined>;
  findByMemberIdAndIdempotencyKey(memberId: string, idempotencyKey: string): Promise<PaymentModel | undefined>;
  findByIdForUpdate(id: string): Promise<PaymentModel | undefined>;
}
