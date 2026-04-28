import type { MovieModel } from '../../../domain';
import type { RepositoryPort } from './repository.port';

export interface MovieRepositoryPort extends RepositoryPort<MovieModel> {}
