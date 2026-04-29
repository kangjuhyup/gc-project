export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');

export type TransactionPropagation = 'REQUIRED' | 'NEW';

export interface TransactionManagerPort {
  runInTransaction<T>(
    work: () => Promise<T>,
    propagation?: TransactionPropagation,
  ): Promise<T>;
}
