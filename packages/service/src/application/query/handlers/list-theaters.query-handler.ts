import { Logging } from '@kangjuhyup/rvlog';
import { type ListTheatersQuery, type TheaterListResultDto } from '../dto';
import type { TheaterQueryPort } from '../ports';

@Logging
export class ListTheatersQueryHandler {
  constructor(private readonly theaterQuery: TheaterQueryPort) {}

  execute(query: ListTheatersQuery): Promise<TheaterListResultDto> {
    return this.theaterQuery.list(query);
  }
}
