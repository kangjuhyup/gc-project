import { describe, expect, it, vi } from 'vitest';
import { ListTheatersQuery } from '@application/query/dto';
import { MikroOrmTheaterQueryRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmTheaterQueryRepository', () => {
  it('현재 위치가 없으면 영화관 목록을 기본 순서로 조회한다', async () => {
    const entityManager = {
      execute: vi.fn().mockResolvedValue([
        {
          id: '1',
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
          latitude: '37.5065',
          longitude: '127.0530',
        },
      ]),
    };
    const repository = new MikroOrmTheaterQueryRepository(entityManager as never);

    const result = await repository.list(ListTheatersQuery.of({}));

    const [sql] = entityManager.execute.mock.calls[0] as [string];
    expect(sql).toContain('ORDER BY id ASC');
    expect(result.items[0]?.distanceMeters).toBeUndefined();
    expect(result.items[0]?.latitude).toBe(37.5065);
  });

  it('현재 위치가 있으면 거리 계산 기준으로 영화관 목록을 조회한다', async () => {
    const entityManager = {
      execute: vi.fn().mockResolvedValue([
        {
          id: '1',
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
          latitude: '37.5065',
          longitude: '127.0530',
          distanceMeters: '120.5',
        },
      ]),
    };
    const repository = new MikroOrmTheaterQueryRepository(entityManager as never);

    const result = await repository.list(
      ListTheatersQuery.of({ latitude: 37.5, longitude: 127.05 }),
    );

    const [sql, params] = entityManager.execute.mock.calls[0] as [string, number[]];
    expect(sql).toContain('AS "distanceMeters"');
    expect(sql).toContain('"distanceMeters" ASC');
    expect(params).toEqual([37.5, 37.5, 127.05]);
    expect(result.items[0]?.distanceMeters).toBe(120.5);
  });
});
