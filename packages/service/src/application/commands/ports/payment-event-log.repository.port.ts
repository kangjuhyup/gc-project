import type { PaymentEventLogModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const PAYMENT_EVENT_LOG_REPOSITORY = Symbol('PAYMENT_EVENT_LOG_REPOSITORY');

export interface PaymentEventLogRepositoryPort extends RepositoryPort<PaymentEventLogModel> {}
