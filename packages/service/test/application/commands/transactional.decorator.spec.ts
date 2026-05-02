import { describe, expect, it, vi } from 'vitest';
import {
  clearTransactionalDecorator,
  configureTransactionalDecorator,
  Transactional,
} from '@application/commands/decorators';
import type { TransactionManagerPort } from '@application/commands/ports';

describe('Transactional decorator', () => {
  it('트랜잭션 매니저를 통해 메서드 실행을 감싼다', async () => {
    const transactionManager: TransactionManagerPort = {
      runInTransaction: vi.fn(async (work) => await work()),
    };
    configureTransactionalDecorator(transactionManager);

    class TestHandler {
      @Transactional()
      async execute(value: string): Promise<string> {
        return `handled-${value}`;
      }
    }

    const handler = new TestHandler();
    const result = await handler.execute('payment');

    expect(transactionManager.runInTransaction).toHaveBeenCalledWith(
      expect.any(Function),
      'REQUIRED',
    );
    expect(result).toBe('handled-payment');
  });

  it('데코레이터용 트랜잭션 매니저가 설정되지 않으면 명시적인 에러를 던진다', async () => {
    clearTransactionalDecorator();

    class TestHandler {
      @Transactional('NEW')
      async execute(): Promise<string> {
        return 'handled';
      }
    }

    await expect(new TestHandler().execute()).rejects.toThrow(
      'Transactional method "execute" requires a configured transaction manager',
    );
  });
});
