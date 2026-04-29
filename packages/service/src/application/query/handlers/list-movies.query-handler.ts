import { Logging } from '@kangjuhyup/rvlog';
import { type ListMoviesQuery, type MovieListResultDto } from '../dto';
import type { MovieQueryPort } from '../ports';

@Logging
export class ListMoviesQueryHandler {
  constructor(private readonly movieQuery: MovieQueryPort) {}

  execute(query: ListMoviesQuery): Promise<MovieListResultDto> {
    return this.movieQuery.list(query);
  }
}
