import { PersistenceModel } from '@domain/shared';
import { DomainError, DomainErrorCode } from '@domain/errors';
import { ReservationStatus, type ReservationStatusType } from '@domain/property';

export interface ReservationPersistenceProps {
  readonly reservationNumber: string;
  readonly memberId: string;
  readonly screeningId: string;
  readonly status: ReservationStatusType;
  readonly totalPrice: number;
  readonly canceledAt?: Date;
  readonly cancelReason?: string;
}

export class ReservationModel extends PersistenceModel<string, ReservationPersistenceProps> {
  private constructor(props: ReservationPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: ReservationPersistenceProps): ReservationModel {
    return new ReservationModel(props);
  }

  assertOwnedBy(memberId: string): void {
    if (this.memberId !== memberId) {
      throw new Error('RESERVATION_FORBIDDEN');
    }
  }

  cancel(params: { reason?: string; now: Date }): ReservationModel {
    if (this.status !== ReservationStatus.CONFIRMED) {
      throw new DomainError(DomainErrorCode.INVALID_RESERVATION_STATUS);
    }

    return new ReservationModel(
      {
        ...this.etc,
        status: ReservationStatus.CANCELED,
        canceledAt: params.now,
        cancelReason: params.reason,
      },
      this.id,
    ).setPersistence(this.id, this.createdAt, params.now);
  }

  get reservationNumber(): string {
    return this.etc.reservationNumber;
  }

  get memberId(): string {
    return this.etc.memberId;
  }

  get screeningId(): string {
    return this.etc.screeningId;
  }

  get status(): ReservationStatusType {
    return this.etc.status;
  }

  get totalPrice(): number {
    return this.etc.totalPrice;
  }

  get canceledAt(): Date | undefined {
    return this.etc.canceledAt;
  }

  get cancelReason(): string | undefined {
    return this.etc.cancelReason;
  }
}
