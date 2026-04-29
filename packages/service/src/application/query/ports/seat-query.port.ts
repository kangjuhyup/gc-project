import type { ListScreeningSeatsQuery, ScreeningSeatListResultDto } from '../dto';

export const SEAT_QUERY = Symbol('SEAT_QUERY');

export interface SeatQueryPort {
  listByScreening(query: ListScreeningSeatsQuery): Promise<ScreeningSeatListResultDto>;
}
