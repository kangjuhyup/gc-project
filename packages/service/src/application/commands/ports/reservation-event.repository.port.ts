import type { ReservationEventModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export interface ReservationEventRepositoryPort extends RepositoryPort<ReservationEventModel> {}
