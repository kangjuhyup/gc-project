import { describe, expect, it, vi } from 'vitest';
import { Transactional } from '@application';
import type { TransactionManagerPort } from '@application/commands/ports';

describe('Transactional decorator', () => {
  it('트랜잭션 매니저를 통해 메서드 실행을 감싼다', async () => {
    const transactionManager: TransactionManagerPort = {
      runInTransaction: vi.fn(async (work) => await work()),
    };
    class TestHandler {
      constructor(readonly transactionManager: TransactionManagerPort) {}

      @Transactional()
      async execute(value: string): Promise<string> {
        return `handled-${value}`;
      }
    }

    const handler = new TestHandler(transactionManager);
    const result = await handler.execute('payment');

    expect(transactionManager.runInTransaction).toHaveBeenCalledWith(expect.any(Function), 'REQUIRED');
    expect(result).toBe('handled-payment');
  });

  it('transactionManager 속성이 없으면 명시적인 에러를 던진다', async () => {
    class TestHandler {
      @Transactional('NEW')
      async execute(): Promise<string> {
        return 'handled';
      }
    }

    await expect(new TestHandler().execute()).rejects.toThrow(
      'Transactional method "execute" requires a transactionManager property',
    );
  });
});
