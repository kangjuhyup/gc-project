import { DomainError, DomainErrorCode } from '@domain/errors';
import { PaymentStatus, type PaymentProviderType, type PaymentStatusType } from '@domain/property';
import { PersistenceModel } from '@domain/shared';

export interface PaymentPersistenceProps {
  readonly memberId: string;
  readonly seatHoldId: string;
  readonly seatHoldIds?: string[];
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly reservationId?: string;
  readonly provider: PaymentProviderType;
  readonly providerPaymentId?: string;
  readonly amount: number;
  readonly status: PaymentStatusType;
  readonly requestedAt: Date;
  readonly approvedAt?: Date;
  readonly failedAt?: Date;
  readonly refundedAt?: Date;
  readonly failureReason?: string;
}

export class PaymentModel extends PersistenceModel<string, PaymentPersistenceProps> {
  private constructor(props: PaymentPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: PaymentPersistenceProps): PaymentModel {
    return new PaymentModel(props);
  }

  static request(params: {
    memberId: string;
    seatHoldId?: string;
    seatHoldIds?: string[];
    idempotencyKey: string;
    requestHash: string;
    provider: PaymentProviderType;
    amount: number;
    now: Date;
  }): PaymentModel {
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new DomainError(DomainErrorCode.INVALID_PAYMENT_AMOUNT);
    }

    const seatHoldIds = params.seatHoldIds ?? (params.seatHoldId === undefined ? [] : [params.seatHoldId]);
    const primarySeatHoldId = seatHoldIds[0];

    if (primarySeatHoldId === undefined) {
      throw new Error('INVALID_PAYMENT_SEAT_HOLDS');
    }

    return new PaymentModel({
      memberId: params.memberId,
      seatHoldId: primarySeatHoldId,
      seatHoldIds,
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      provider: params.provider,
      amount: params.amount,
      status: PaymentStatus.PENDING,
      requestedAt: params.now,
    });
  }

  assertIdempotentRequestHash(requestHash: string): void {
    if (this.requestHash !== requestHash) {
      throw new Error('PAYMENT_IDEMPOTENCY_KEY_CONFLICT');
    }
  }

  assertProvider(provider: PaymentProviderType): void {
    if (this.provider !== provider) {
      throw new Error('PAYMENT_PROVIDER_MISMATCH');
    }
  }

  assertOwnedBy(memberId: string, errorMessage = 'PAYMENT_FORBIDDEN'): void {
    if (this.memberId !== memberId) {
      throw new Error(errorMessage);
    }
  }

  requireProviderPaymentId(): string {
    if (this.providerPaymentId === undefined) {
      throw new Error('PAYMENT_PROVIDER_PAYMENT_ID_REQUIRED');
    }

    return this.providerPaymentId;
  }

  isCallbackHandled(): boolean {
    return this.status === PaymentStatus.APPROVED || this.status === PaymentStatus.FAILED;
  }

  markApproving(params: { providerPaymentId: string; amount: number; now: Date }): PaymentModel {
    if (this.status !== PaymentStatus.PENDING) {
      return this;
    }

    if (this.amount !== params.amount) {
      throw new DomainError(DomainErrorCode.PAYMENT_AMOUNT_MISMATCH);
    }

    return new PaymentModel({
      ...this.etc,
      providerPaymentId: params.providerPaymentId,
      status: PaymentStatus.APPROVING,
    }, this.id).setPersistence(this.id, this.createdAt, params.now);
  }

  approve(params: { reservationId: string; now: Date }): PaymentModel {
    if (this.status === PaymentStatus.APPROVED) {
      return this;
    }

    if (this.status !== PaymentStatus.APPROVING) {
      throw new DomainError(DomainErrorCode.INVALID_PAYMENT_STATUS);
    }

    return new PaymentModel({
      ...this.etc,
      reservationId: params.reservationId,
      status: PaymentStatus.APPROVED,
      approvedAt: params.now,
    }, this.id).setPersistence(this.id, this.createdAt, params.now);
  }

  fail(params: { providerPaymentId?: string; reason?: string; now: Date }): PaymentModel {
    if (this.status === PaymentStatus.FAILED) {
      return this;
    }

    if (this.status !== PaymentStatus.PENDING) {
      throw new DomainError(DomainErrorCode.INVALID_PAYMENT_STATUS);
    }

    return new PaymentModel({
      ...this.etc,
      providerPaymentId: params.providerPaymentId ?? this.providerPaymentId,
      status: PaymentStatus.FAILED,
      failedAt: params.now,
      failureReason: params.reason,
    }, this.id).setPersistence(this.id, this.createdAt, params.now);
  }

  requireRefund(params: { reason: string; now: Date }): PaymentModel {
    if (this.status === PaymentStatus.REFUND_REQUIRED || this.status === PaymentStatus.REFUNDING) {
      return this;
    }

    if (this.status !== PaymentStatus.APPROVING) {
      throw new DomainError(DomainErrorCode.INVALID_PAYMENT_STATUS);
    }

    return new PaymentModel({
      ...this.etc,
      status: PaymentStatus.REFUND_REQUIRED,
      failureReason: params.reason,
    }, this.id).setPersistence(this.id, this.createdAt, params.now);
  }

  requestCancelRefund(params: { reason: string; now: Date }): PaymentModel {
    if (this.status !== PaymentStatus.APPROVED) {
      throw new DomainError(DomainErrorCode.INVALID_PAYMENT_STATUS);
    }

    return new PaymentModel({
      ...this.etc,
      status: PaymentStatus.REFUND_REQUIRED,
      failureReason: params.reason,
    }, this.id).setPersistence(this.id, this.createdAt, params.now);
  }

  startRefund(params: { now: Date }): PaymentModel {
    if (this.status === PaymentStatus.REFUNDING) {
      return this;
    }

    if (this.status !== PaymentStatus.REFUND_REQUIRED && this.status !== PaymentStatus.REFUND_FAILED) {
      throw new DomainError(DomainErrorCode.INVALID_PAYMENT_STATUS);
    }

    return new PaymentModel({
      ...this.etc,
      status: PaymentStatus.REFUNDING,
    }, this.id).setPersistence(this.id, this.createdAt, params.now);
  }

  completeRefund(params: { now: Date }): PaymentModel {
    if (this.status === PaymentStatus.REFUNDED) {
      return this;
    }

    if (this.status !== PaymentStatus.REFUNDING) {
      throw new DomainError(DomainErrorCode.INVALID_PAYMENT_STATUS);
    }

    return new PaymentModel({
      ...this.etc,
      status: PaymentStatus.REFUNDED,
      refundedAt: params.now,
    }, this.id).setPersistence(this.id, this.createdAt, params.now);
  }

  failRefund(params: { reason: string; now: Date }): PaymentModel {
    if (this.status !== PaymentStatus.REFUNDING) {
      throw new DomainError(DomainErrorCode.INVALID_PAYMENT_STATUS);
    }

    return new PaymentModel({
      ...this.etc,
      status: PaymentStatus.REFUND_FAILED,
      failureReason: params.reason,
    }, this.id).setPersistence(this.id, this.createdAt, params.now);
  }

  get memberId(): string {
    return this.etc.memberId;
  }

  get seatHoldId(): string {
    return this.etc.seatHoldId;
  }

  get seatHoldIds(): string[] {
    return this.etc.seatHoldIds ?? [this.etc.seatHoldId];
  }

  get idempotencyKey(): string {
    return this.etc.idempotencyKey;
  }

  get requestHash(): string {
    return this.etc.requestHash;
  }

  get reservationId(): string | undefined {
    return this.etc.reservationId;
  }

  get provider(): PaymentProviderType {
    return this.etc.provider;
  }

  get providerPaymentId(): string | undefined {
    return this.etc.providerPaymentId;
  }

  get amount(): number {
    return this.etc.amount;
  }

  get status(): PaymentStatusType {
    return this.etc.status;
  }

  get requestedAt(): Date {
    return this.etc.requestedAt;
  }

  get approvedAt(): Date | undefined {
    return this.etc.approvedAt;
  }

  get failedAt(): Date | undefined {
    return this.etc.failedAt;
  }

  get refundedAt(): Date | undefined {
    return this.etc.refundedAt;
  }

  get failureReason(): string | undefined {
    return this.etc.failureReason;
  }
}
