import type { ReservationEventModel } from '@domain';
import type { RepositoryPort } from './repository.port';

export const RESERVATION_EVENT_REPOSITORY = Symbol('RESERVATION_EVENT_REPOSITORY');

export interface ReservationEventRepositoryPort extends RepositoryPort<ReservationEventModel> {}
