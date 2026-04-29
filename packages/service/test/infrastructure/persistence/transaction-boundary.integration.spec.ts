import { Entity, MikroORM, PrimaryKey, Property, RequestContext } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MikroOrmTransactionManager } from '@infrastructure/persistence/repositories';

@Entity()
class TransactionBoundaryProbeEntity {
  @PrimaryKey({ autoincrement: true })
  id?: number;

  @Property()
  label!: string;
}

describe('MikroOrmTransactionManager transaction boundary integration', () => {
  let orm: MikroORM;
  let transactionManager: MikroOrmTransactionManager;

  beforeAll(async () => {
    orm = await MikroORM.init({
      allowGlobalContext: true,
      dbName: ':memory:',
      debug: false,
      driver: BetterSqliteDriver,
      entities: [TransactionBoundaryProbeEntity],
    });
    transactionManager = new MikroOrmTransactionManager(orm);
    await orm.schema.createSchema();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(TransactionBoundaryProbeEntity, {});
    orm.em.clear();
  });

  afterAll(async () => {
    await orm?.close(true);
  });

  it('트랜잭션 내부 작업은 RequestContext EntityManager를 통해 commit된다', async () => {
    await transactionManager.runInTransaction(async () => {
      const entityManager = RequestContext.getEntityManager();

      expect(entityManager).toBeDefined();
      const probe = entityManager?.create(TransactionBoundaryProbeEntity, { label: 'committed' });
      entityManager?.persist(probe);
      await entityManager?.flush();
    });

    orm.em.clear();

    await expect(orm.em.count(TransactionBoundaryProbeEntity)).resolves.toBe(1);
  });

  it('트랜잭션 내부 오류가 발생하면 RequestContext EntityManager 작업도 rollback된다', async () => {
    await expect(
      transactionManager.runInTransaction(async () => {
        const entityManager = RequestContext.getEntityManager();

        expect(entityManager).toBeDefined();
        const probe = entityManager?.create(TransactionBoundaryProbeEntity, { label: 'rolled-back' });
        entityManager?.persist(probe);
        await entityManager?.flush();
        throw new Error('ROLLBACK_PROBE');
      }),
    ).rejects.toThrow('ROLLBACK_PROBE');

    orm.em.clear();

    await expect(orm.em.count(TransactionBoundaryProbeEntity)).resolves.toBe(0);
  });
});
