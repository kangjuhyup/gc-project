import { describe, expect, it, vi } from 'vitest';
import { QueryBus } from '@application';

class TestQuery {
  private constructor(readonly value: string) {}

  static of(params: { value: string }): TestQuery {
    return new TestQuery(params.value);
  }
}

class UnregisteredQuery {
  private constructor() {}

  static of(): UnregisteredQuery {
    return new UnregisteredQuery();
  }
}

describe('QueryBus', () => {
  it('등록된 query 타입에 맞는 handler로 실행을 위임한다', async () => {
    const handler = { execute: vi.fn().mockResolvedValue('queried') };
    const query = TestQuery.of({ value: 'query-value' });
    const bus = QueryBus.of([{ query: TestQuery, handler }]);

    const result = await bus.execute(query);

    expect(handler.execute).toHaveBeenCalledWith(query);
    expect(result).toBe('queried');
  });

  it('등록되지 않은 query는 명시적인 에러로 거부한다', async () => {
    const bus = QueryBus.of([]);

    await expect(bus.execute(UnregisteredQuery.of())).rejects.toThrow('QUERY_HANDLER_NOT_FOUND');
  });
});
