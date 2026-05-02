import type { TransactionManagerPort, TransactionPropagation } from '../ports';

let transactionManager: TransactionManagerPort | undefined;

export function configureTransactionalDecorator(manager: TransactionManagerPort): void {
  transactionManager = manager;
}

export function clearTransactionalDecorator(): void {
  transactionManager = undefined;
}

export function Transactional(propagation: TransactionPropagation = 'REQUIRED'): MethodDecorator {
  return (_target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as ((...args: unknown[]) => Promise<unknown>) | undefined;

    if (!original) {
      throw new Error('@Transactional can only be applied to methods');
    }

    descriptor.value = async function (...args: unknown[]) {
      if (!transactionManager) {
        throw new Error(
          `Transactional method "${String(propertyKey)}" requires a configured transaction manager`,
        );
      }

      return transactionManager.runInTransaction(() => original.apply(this, args), propagation);
    };

    return descriptor;
  };
}
