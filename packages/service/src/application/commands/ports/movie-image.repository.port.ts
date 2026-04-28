import type { MovieImageModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export interface MovieImageRepositoryPort extends RepositoryPort<MovieImageModel> {}
