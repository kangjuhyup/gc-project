import type { TheaterModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export interface TheaterRepositoryPort extends RepositoryPort<TheaterModel> {}
