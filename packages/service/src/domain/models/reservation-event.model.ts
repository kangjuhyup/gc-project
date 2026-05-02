import { PersistenceModel } from '@domain/shared';
import type { ReservationEventTypeType } from '@domain/property';

export interface ReservationEventPersistenceProps {
  readonly reservationId: string;
  readonly eventType: ReservationEventTypeType;
  readonly description?: string;
}

export class ReservationEventModel extends PersistenceModel<
  string,
  ReservationEventPersistenceProps
> {
  private constructor(props: ReservationEventPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: ReservationEventPersistenceProps): ReservationEventModel {
    return new ReservationEventModel(props);
  }

  get reservationId(): string {
    return this.etc.reservationId;
  }

  get eventType(): ReservationEventTypeType {
    return this.etc.eventType;
  }

  get description(): string | undefined {
    return this.etc.description;
  }
}
