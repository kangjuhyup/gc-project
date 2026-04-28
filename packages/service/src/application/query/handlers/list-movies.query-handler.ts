import { type ListMoviesQuery, type MovieListResultDto } from '../dto';
import type { MovieQueryPort } from '../ports';

export class ListMoviesQueryHandler {
  constructor(private readonly movieQuery: MovieQueryPort) {}

  execute(query: ListMoviesQuery): Promise<MovieListResultDto> {
    return this.movieQuery.list(query);
  }
}
