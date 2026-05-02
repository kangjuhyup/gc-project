import { describe, expect, it, vi } from 'vitest';
import { ListTheaterScheduleQuery, ListTheatersQuery } from '@application/query/dto';
import { TheaterController } from '@presentation/http';

describe('TheaterController', () => {
  it('영화관 목록 조회 요청을 query bus에 위임한다', async () => {
    const expected = { items: [] };
    const queryBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new TheaterController(queryBus as never);

    const result = await controller.list({
      latitude: 37.5,
      longitude: 127.05,
    } as never);

    expect(queryBus.execute).toHaveBeenCalledWith(
      ListTheatersQuery.of({ latitude: 37.5, longitude: 127.05 }),
    );
    expect(result).toBe(expected);
  });

  it('영화관별 상영 시간표 조회 요청을 query bus에 위임한다', async () => {
    const expected = {
      theater: { id: 1, name: 'GC 시네마 강남' },
      date: '2026-05-01',
      movies: [],
    };
    const queryBus = { execute: vi.fn().mockResolvedValue(expected) };
    const controller = new TheaterController(queryBus as never);

    const result = await controller.listSchedule(
      { theaterId: '1' } as never,
      { date: '2026-05-01' } as never,
    );

    expect(queryBus.execute).toHaveBeenCalledWith(
      ListTheaterScheduleQuery.of({
        theaterId: '1',
        date: '2026-05-01',
      }),
    );
    expect(result).toBe(expected);
  });
});
