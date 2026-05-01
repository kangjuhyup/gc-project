import type { AdminMovieListResultDto, ListAdminMoviesQuery, ListMoviesQuery, MovieListResultDto } from '../dto';

export const MOVIE_QUERY = Symbol('MOVIE_QUERY');

export interface MovieQueryPort {
  list(query: ListMoviesQuery): Promise<MovieListResultDto>;
  listAdminMovies(query: ListAdminMoviesQuery): Promise<AdminMovieListResultDto>;
}
