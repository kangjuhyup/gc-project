import { PersistenceModel } from '@domain/shared';

export interface ReservationSeatPersistenceProps {
  readonly reservationId: string;
  readonly screeningId: string;
  readonly seatId: string;
}

export class ReservationSeatModel extends PersistenceModel<
  string,
  ReservationSeatPersistenceProps
> {
  private constructor(props: ReservationSeatPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: ReservationSeatPersistenceProps): ReservationSeatModel {
    return new ReservationSeatModel(props);
  }

  get reservationId(): string {
    return this.etc.reservationId;
  }

  get screeningId(): string {
    return this.etc.screeningId;
  }

  get seatId(): string {
    return this.etc.seatId;
  }
}
