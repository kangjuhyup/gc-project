import { describe, expect, it, vi } from 'vitest';
import { ListTheatersQuery } from '@application/query/dto';
import { TheaterController } from '@presentation/http';

describe('TheaterController', () => {
  it('영화관 목록 조회 요청을 query handler에 위임한다', async () => {
    const expected = { items: [] };
    const queryHandler = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new TheaterController(queryHandler as never);

    const result = await controller.list({
      latitude: 37.5,
      longitude: 127.05,
    } as never);

    expect(queryHandler.execute).toHaveBeenCalledWith(
      ListTheatersQuery.of({ latitude: 37.5, longitude: 127.05 }),
    );
    expect(result).toBe(expected);
  });
});
