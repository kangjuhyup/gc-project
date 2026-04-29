import { PersistenceModel } from '@domain/shared';
import { SeatHoldStatus, type SeatHoldStatusType } from '@domain/property';

export interface SeatHoldPersistenceProps {
  readonly screeningId: string;
  readonly seatId: string;
  readonly memberId: string;
  readonly reservationId?: string;
  readonly status: SeatHoldStatusType;
  readonly expiresAt: Date;
}

export class SeatHoldModel extends PersistenceModel<string, SeatHoldPersistenceProps> {
  private constructor(props: SeatHoldPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: SeatHoldPersistenceProps): SeatHoldModel {
    return new SeatHoldModel(props);
  }

  release(params: { memberId: string }): SeatHoldModel {
    if (this.memberId !== params.memberId) {
      throw new Error('SEAT_HOLD_FORBIDDEN');
    }

    if (this.reservationId !== undefined || this.status === SeatHoldStatus.CONFIRMED) {
      throw new Error('SEAT_HOLD_PAYMENT_COMPLETED');
    }

    if (this.status !== SeatHoldStatus.HELD) {
      throw new Error('SEAT_HOLD_NOT_RELEASABLE');
    }

    return new SeatHoldModel(
      {
        ...this.etc,
        status: SeatHoldStatus.RELEASED,
      },
      this.id,
    ).setPersistence(this.id, this.createdAt, this.updatedAt);
  }

  confirm(params: { reservationId: string; now: Date }): SeatHoldModel {
    if (this.status === SeatHoldStatus.CONFIRMED && this.reservationId === params.reservationId) {
      return this;
    }

    if (this.status !== SeatHoldStatus.HELD) {
      throw new Error('SEAT_HOLD_NOT_CONFIRMABLE');
    }

    return new SeatHoldModel(
      {
        ...this.etc,
        reservationId: params.reservationId,
        status: SeatHoldStatus.CONFIRMED,
      },
      this.id,
    ).setPersistence(this.id, this.createdAt, params.now);
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

  get status(): SeatHoldStatusType {
    return this.etc.status;
  }

  get expiresAt(): Date {
    return this.etc.expiresAt;
  }
}
