import type { ListTheatersQuery, TheaterListResultDto } from '../dto';

export const THEATER_QUERY = Symbol('THEATER_QUERY');

export interface TheaterQueryPort {
  list(query: ListTheatersQuery): Promise<TheaterListResultDto>;
}
