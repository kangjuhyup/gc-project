import { describe, expect, it, vi } from 'vitest';
import { ListScreeningSeatsQuery, ScreeningSeatListResultDto, ScreeningSeatSummaryDto } from '@application/query/dto';
import { ListScreeningSeatsQueryHandler } from '@application/query/handlers';
import type { SeatQueryPort } from '@application/query/ports';

describe('ListScreeningSeatsQueryHandler', () => {
  it('상영 좌석 목록 요청을 query port에 위임한다', async () => {
    const expected = ScreeningSeatListResultDto.of({
      screeningId: '101',
      seats: [
        ScreeningSeatSummaryDto.of({
          id: '1001',
          row: 'A',
          col: 1,
          type: 'NORMAL',
          status: 'AVAILABLE',
        }),
      ],
    });
    const seatQuery = {
      listByScreening: vi.fn().mockResolvedValue(expected),
    } satisfies SeatQueryPort;
    const handler = new ListScreeningSeatsQueryHandler(seatQuery);
    const query = ListScreeningSeatsQuery.of({ screeningId: '101' });

    const result = await handler.execute(query);

    expect(seatQuery.listByScreening).toHaveBeenCalledWith(query);
    expect(result).toBe(expected);
  });
});
