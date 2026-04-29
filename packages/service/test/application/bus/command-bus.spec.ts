import { describe, expect, it, vi } from 'vitest';
import { CommandBus } from '@application';

class TestCommand {
  private constructor(readonly value: string) {}

  static of(params: { value: string }): TestCommand {
    return new TestCommand(params.value);
  }
}

class UnregisteredCommand {
  private constructor() {}

  static of(): UnregisteredCommand {
    return new UnregisteredCommand();
  }
}

describe('CommandBus', () => {
  it('등록된 command 타입에 맞는 handler로 실행을 위임한다', async () => {
    const handler = { execute: vi.fn().mockResolvedValue('handled') };
    const command = TestCommand.of({ value: 'command-value' });
    const bus = CommandBus.of([{ command: TestCommand, handler }]);

    const result = await bus.execute(command);

    expect(handler.execute).toHaveBeenCalledWith(command);
    expect(result).toBe('handled');
  });

  it('등록되지 않은 command는 명시적인 에러로 거부한다', async () => {
    const bus = CommandBus.of([]);

    await expect(bus.execute(UnregisteredCommand.of())).rejects.toThrow('COMMAND_HANDLER_NOT_FOUND');
  });
});
