import { Logging } from '@kangjuhyup/rvlog';
import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import type { TransactionManagerPort, TransactionPropagation } from '@application/commands/ports';

@Injectable()
@Logging
export class MikroOrmTransactionManager implements TransactionManagerPort {
  constructor(private readonly orm: MikroORM) {}

  async runInTransaction<T>(
    work: () => Promise<T>,
    propagation: TransactionPropagation = 'REQUIRED',
  ): Promise<T> {
    const entityManager = propagation === 'NEW' ? this.orm.em.fork() : this.orm.em;
    return await entityManager.transactional(() => work());
  }
}
