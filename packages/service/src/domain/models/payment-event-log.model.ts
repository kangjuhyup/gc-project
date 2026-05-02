import type {
  PaymentEventTypeType,
  PaymentProviderType,
  PaymentStatusType,
} from '@domain/property';
import { PersistenceModel } from '@domain/shared';

export interface PaymentEventLogPersistenceProps {
  readonly paymentId: string;
  readonly eventType: PaymentEventTypeType;
  readonly previousStatus?: PaymentStatusType;
  readonly nextStatus: PaymentStatusType;
  readonly provider: PaymentProviderType;
  readonly providerPaymentId?: string;
  readonly amount: number;
  readonly reason?: string;
  readonly metadata?: Record<string, unknown>;
  readonly occurredAt: Date;
}

export class PaymentEventLogModel extends PersistenceModel<
  string,
  PaymentEventLogPersistenceProps
> {
  private constructor(props: PaymentEventLogPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: PaymentEventLogPersistenceProps): PaymentEventLogModel {
    return new PaymentEventLogModel(props);
  }

  get paymentId(): string {
    return this.etc.paymentId;
  }

  get eventType(): PaymentEventTypeType {
    return this.etc.eventType;
  }

  get previousStatus(): PaymentStatusType | undefined {
    return this.etc.previousStatus;
  }

  get nextStatus(): PaymentStatusType {
    return this.etc.nextStatus;
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

  get reason(): string | undefined {
    return this.etc.reason;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.etc.metadata;
  }

  get occurredAt(): Date {
    return this.etc.occurredAt;
  }
}
