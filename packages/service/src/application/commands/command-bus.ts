import { Logging } from '@kangjuhyup/rvlog';

type CommandType<COMMAND extends object = object> = Function & { prototype: COMMAND };

export interface CommandHandler<COMMAND extends object = object, RESULT = unknown> {
  execute(command: COMMAND): Promise<RESULT> | RESULT;
}

interface CommandHandlerRegistration<COMMAND extends object = object, RESULT = unknown> {
  command: CommandType<COMMAND>;
  handler: CommandHandler<COMMAND, RESULT>;
}

@Logging
export class CommandBus {
  private readonly handlers: Map<Function, CommandHandler>;

  constructor(registrations: CommandHandlerRegistration[]) {
    this.handlers = new Map(
      registrations.map((registration) => [registration.command, registration.handler]),
    );
  }

  static of(registrations: CommandHandlerRegistration[]): CommandBus {
    return new CommandBus(registrations);
  }

  async execute<COMMAND extends object, RESULT = unknown>(command: COMMAND): Promise<RESULT> {
    const handler = this.handlers.get(command.constructor);

    if (handler === undefined) {
      throw new Error('COMMAND_HANDLER_NOT_FOUND');
    }

    return (await handler.execute(command)) as RESULT;
  }
}
