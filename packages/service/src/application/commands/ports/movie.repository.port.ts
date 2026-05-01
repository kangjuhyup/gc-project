import type { MovieModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const MOVIE_REPOSITORY = Symbol('MOVIE_REPOSITORY');

export interface MovieRepositoryPort extends RepositoryPort<MovieModel> {}
