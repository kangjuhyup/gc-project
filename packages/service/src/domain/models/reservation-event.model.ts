import { PersistenceModel } from '../shared';

export type ReservationEventType = 'CREATED' | 'CONFIRMED' | 'CANCELED' | 'EXPIRED';

export interface ReservationEventPersistenceProps {
  readonly reservationId: string;
  readonly eventType: ReservationEventType;
  readonly description?: string;
}

export class ReservationEventModel extends PersistenceModel<string, ReservationEventPersistenceProps> {
  private constructor(props: ReservationEventPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: ReservationEventPersistenceProps): ReservationEventModel {
    return new ReservationEventModel(props);
  }

  get reservationId(): string {
    return this.etc.reservationId;
  }

  get eventType(): ReservationEventType {
    return this.etc.eventType;
  }

  get description(): string | undefined {
    return this.etc.description;
  }
}
