import { Logging } from '@kangjuhyup/rvlog';
import { type ListMovieScheduleQuery, type MovieScheduleResultDto } from '../dto';
import type { MovieQueryPort } from '../ports';

@Logging
export class ListMovieScheduleQueryHandler {
  constructor(private readonly movieQuery: MovieQueryPort) {}

  execute(query: ListMovieScheduleQuery): Promise<MovieScheduleResultDto> {
    return this.movieQuery.listSchedule(query);
  }
}
