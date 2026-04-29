import { beforeEach, vi } from 'vitest';
import { configureTransactionalDecorator } from '@application/commands/decorators';
import type { TransactionManagerPort } from '@application/commands/ports';

const testTransactionManager: TransactionManagerPort = {
  runInTransaction: vi.fn(async (work) => await work()),
};

beforeEach(() => {
  vi.mocked(testTransactionManager.runInTransaction).mockClear();
  configureTransactionalDecorator(testTransactionManager);
});
