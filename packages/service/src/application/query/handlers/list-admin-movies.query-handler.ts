import { Logging } from '@kangjuhyup/rvlog';
import type { AdminMovieListResultDto, ListAdminMoviesQuery } from '../dto';
import type { MovieQueryPort } from '../ports';

@Logging
export class ListAdminMoviesQueryHandler {
  constructor(private readonly movieQuery: MovieQueryPort) {}

  execute(query: ListAdminMoviesQuery): Promise<AdminMovieListResultDto> {
    return this.movieQuery.listAdminMovies(query);
  }
}
