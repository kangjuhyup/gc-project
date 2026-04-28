import type { ListMoviesQuery, MovieListResultDto } from '../dto';

export const MOVIE_QUERY = Symbol('MOVIE_QUERY');

export interface MovieQueryPort {
  list(query: ListMoviesQuery): Promise<MovieListResultDto>;
}
