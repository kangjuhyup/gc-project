import { Logging } from '@kangjuhyup/rvlog';
import { type ListTheaterScheduleQuery, type TheaterScheduleResultDto } from '../dto';
import type { TheaterQueryPort } from '../ports';

@Logging
export class ListTheaterScheduleQueryHandler {
  constructor(private readonly theaterQuery: TheaterQueryPort) {}

  execute(query: ListTheaterScheduleQuery): Promise<TheaterScheduleResultDto> {
    return this.theaterQuery.listSchedule(query);
  }
}
