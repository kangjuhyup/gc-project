import { Logging } from '@kangjuhyup/rvlog';
import { MikroORM, RequestContext } from '@mikro-orm/core';
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
    const currentEntityManager = RequestContext.getEntityManager();
    const entityManager =
      propagation === 'NEW' || currentEntityManager === undefined
        ? this.orm.em.fork()
        : currentEntityManager;

    return await RequestContext.create(entityManager, async () =>
      entityManager.transactional(async (transactionalEntityManager) =>
        RequestContext.create(transactionalEntityManager, async () => await work()),
      ),
    );
  }
}
