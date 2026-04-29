import type { ListScreeningSeatsQuery, ScreeningSeatListResultDto } from '../dto';
import type { SeatQueryPort } from '../ports';

export class ListScreeningSeatsQueryHandler {
  constructor(private readonly seatQuery: SeatQueryPort) {}

  execute(query: ListScreeningSeatsQuery): Promise<ScreeningSeatListResultDto> {
    return this.seatQuery.listByScreening(query);
  }
}
