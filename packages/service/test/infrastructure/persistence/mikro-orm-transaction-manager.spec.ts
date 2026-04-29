import { RequestContext, type MikroORM } from '@mikro-orm/core';
import { describe, expect, it, vi } from 'vitest';
import { MikroOrmTransactionManager } from '@infrastructure/persistence/repositories';

describe('MikroOrmTransactionManager', () => {
  it('기존 MikroORM RequestContext의 EntityManager로 트랜잭션을 실행한다', async () => {
    const transactionalEntityManager = { name: 'transactional-em' };
    const requestEntityManager = {
      transactional: vi.fn(async (work) => await work(transactionalEntityManager)),
    };
    const orm = {
      em: {
        fork: vi.fn(),
      },
    } as unknown as MikroORM;
    const getEntityManagerSpy = vi
      .spyOn(RequestContext, 'getEntityManager')
      .mockReturnValue(requestEntityManager as never);
    const createSpy = vi
      .spyOn(RequestContext, 'create')
      .mockImplementation(async (_entityManager, work) => await work());
    const manager = new MikroOrmTransactionManager(orm);

    const result = await manager.runInTransaction(async () => 'handled');

    expect(result).toBe('handled');
    expect(getEntityManagerSpy).toHaveBeenCalledOnce();
    expect(orm.em.fork).not.toHaveBeenCalled();
    expect(requestEntityManager.transactional).toHaveBeenCalledOnce();
    expect(createSpy.mock.calls[0][0]).toBe(requestEntityManager);
    expect(createSpy.mock.calls[1][0]).toBe(transactionalEntityManager);
  });

  it('NEW 전파는 기존 컨텍스트와 분리된 fork EntityManager를 사용한다', async () => {
    const transactionalEntityManager = { name: 'new-transactional-em' };
    const forkedEntityManager = {
      transactional: vi.fn(async (work) => await work(transactionalEntityManager)),
    };
    const orm = {
      em: {
        fork: vi.fn(() => forkedEntityManager),
      },
    } as unknown as MikroORM;
    vi.spyOn(RequestContext, 'getEntityManager').mockReturnValue({ name: 'request-em' } as never);
    const createSpy = vi
      .spyOn(RequestContext, 'create')
      .mockImplementation(async (_entityManager, work) => await work());
    const manager = new MikroOrmTransactionManager(orm);

    const result = await manager.runInTransaction(async () => 'handled-new', 'NEW');

    expect(result).toBe('handled-new');
    expect(orm.em.fork).toHaveBeenCalledOnce();
    expect(forkedEntityManager.transactional).toHaveBeenCalledOnce();
    expect(createSpy.mock.calls[0][0]).toBe(forkedEntityManager);
    expect(createSpy.mock.calls[1][0]).toBe(transactionalEntityManager);
  });
});
