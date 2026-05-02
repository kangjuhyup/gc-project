import type { PaymentModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface PaymentRepositoryPort extends RepositoryPort<PaymentModel> {
  findBySeatHoldId(seatHoldId: string): Promise<PaymentModel | undefined>;
  findBySeatHoldIds(seatHoldIds: string[]): Promise<PaymentModel[]>;
  findSeatHoldIds(paymentId: string): Promise<string[]>;
  saveSeatHoldLinks(paymentId: string, seatHoldIds: string[]): Promise<void>;
  findByMemberIdAndIdempotencyKey(
    memberId: string,
    idempotencyKey: string,
  ): Promise<PaymentModel | undefined>;
  findByIdForUpdate(id: string): Promise<PaymentModel | undefined>;
  findByReservationIdForUpdate(reservationId: string): Promise<PaymentModel | undefined>;
}
