import { PersistenceModel } from '../shared';

export type SeatHoldStatus = 'HELD' | 'CONFIRMED' | 'EXPIRED' | 'RELEASED';

export interface SeatHoldPersistenceProps {
  readonly screeningId: string;
  readonly seatId: string;
  readonly memberId: string;
  readonly reservationId?: string;
  readonly status: SeatHoldStatus;
  readonly expiresAt: Date;
}

export class SeatHoldModel extends PersistenceModel<string, SeatHoldPersistenceProps> {
  private constructor(props: SeatHoldPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: SeatHoldPersistenceProps): SeatHoldModel {
    return new SeatHoldModel(props);
  }

  get screeningId(): string {
    return this.etc.screeningId;
  }

  get seatId(): string {
    return this.etc.seatId;
  }

  get memberId(): string {
    return this.etc.memberId;
  }

  get reservationId(): string | undefined {
    return this.etc.reservationId;
  }

  get status(): SeatHoldStatus {
    return this.etc.status;
  }

  get expiresAt(): Date {
    return this.etc.expiresAt;
  }
}
