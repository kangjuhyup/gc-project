import type { ListTheaterScheduleQuery, ListTheatersQuery, TheaterListResultDto, TheaterScheduleResultDto } from '../dto';

export const THEATER_QUERY = Symbol('THEATER_QUERY');

export interface TheaterQueryPort {
  list(query: ListTheatersQuery): Promise<TheaterListResultDto>;
  listSchedule(query: ListTheaterScheduleQuery): Promise<TheaterScheduleResultDto>;
}
