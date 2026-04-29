import { Logging } from '@kangjuhyup/rvlog';

type QueryType<QUERY extends object = object> = Function & { prototype: QUERY };

export interface QueryHandler<QUERY extends object = object, RESULT = unknown> {
  execute(query: QUERY): Promise<RESULT> | RESULT;
}

interface QueryHandlerRegistration<QUERY extends object = object, RESULT = unknown> {
  query: QueryType<QUERY>;
  handler: QueryHandler<QUERY, RESULT>;
}

@Logging
export class QueryBus {
  private readonly handlers: Map<Function, QueryHandler>;

  constructor(registrations: QueryHandlerRegistration[]) {
    this.handlers = new Map(
      registrations.map((registration) => [registration.query, registration.handler]),
    );
  }

  static of(registrations: QueryHandlerRegistration[]): QueryBus {
    return new QueryBus(registrations);
  }

  async execute<QUERY extends object, RESULT = unknown>(query: QUERY): Promise<RESULT> {
    const handler = this.handlers.get(query.constructor);

    if (handler === undefined) {
      throw new Error('QUERY_HANDLER_NOT_FOUND');
    }

    return await handler.execute(query) as RESULT;
  }
}
