import type {
  AdminMovieListResultDto,
  ListAdminMoviesQuery,
  ListMovieScheduleQuery,
  ListMoviesQuery,
  MovieListResultDto,
  MovieScheduleResultDto,
} from '../dto';

export const MOVIE_QUERY = Symbol('MOVIE_QUERY');

export interface MovieQueryPort {
  list(query: ListMoviesQuery): Promise<MovieListResultDto>;
  listSchedule(query: ListMovieScheduleQuery): Promise<MovieScheduleResultDto>;
  listAdminMovies(query: ListAdminMoviesQuery): Promise<AdminMovieListResultDto>;
}
