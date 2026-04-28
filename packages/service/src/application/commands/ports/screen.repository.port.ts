import type { ScreenModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export interface ScreenRepositoryPort extends RepositoryPort<ScreenModel> {}
