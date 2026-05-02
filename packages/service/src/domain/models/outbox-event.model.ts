import { OutboxStatus, type OutboxStatusType } from '@domain/property';
import { PersistenceModel } from '@domain/shared';

export interface OutboxEventPersistenceProps {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly status: OutboxStatusType;
  readonly retryCount: number;
  readonly nextRetryAt?: Date;
  readonly lockedUntil?: Date;
  readonly lastError?: string;
  readonly occurredAt: Date;
  readonly publishedAt?: Date;
}

export class OutboxEventModel extends PersistenceModel<string, OutboxEventPersistenceProps> {
  private constructor(props: OutboxEventPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: OutboxEventPersistenceProps): OutboxEventModel {
    return new OutboxEventModel(props);
  }

  static pending(params: {
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
    occurredAt: Date;
  }): OutboxEventModel {
    return new OutboxEventModel({
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      eventType: params.eventType,
      payload: params.payload,
      status: OutboxStatus.PENDING,
      retryCount: 0,
      occurredAt: params.occurredAt,
    });
  }

  markProcessing(params: { lockedUntil: Date; now: Date }): OutboxEventModel {
    return new OutboxEventModel(
      {
        ...this.etc,
        status: OutboxStatus.PROCESSING,
        lockedUntil: params.lockedUntil,
      },
      this.id,
    ).setPersistence(this.id, this.createdAt, params.now);
  }

  markPublished(params: { now: Date }): OutboxEventModel {
    return new OutboxEventModel(
      {
        ...this.etc,
        status: OutboxStatus.PUBLISHED,
        lockedUntil: undefined,
        publishedAt: params.now,
      },
      this.id,
    ).setPersistence(this.id, this.createdAt, params.now);
  }

  markFailed(params: { error: string; nextRetryAt: Date; now: Date }): OutboxEventModel {
    return new OutboxEventModel(
      {
        ...this.etc,
        status: OutboxStatus.FAILED,
        retryCount: this.retryCount + 1,
        nextRetryAt: params.nextRetryAt,
        lockedUntil: undefined,
        lastError: params.error,
      },
      this.id,
    ).setPersistence(this.id, this.createdAt, params.now);
  }

  get aggregateType(): string {
    return this.etc.aggregateType;
  }

  get aggregateId(): string {
    return this.etc.aggregateId;
  }

  get eventType(): string {
    return this.etc.eventType;
  }

  get payload(): Record<string, unknown> {
    return this.etc.payload;
  }

  get status(): OutboxStatusType {
    return this.etc.status;
  }

  get retryCount(): number {
    return this.etc.retryCount;
  }

  get nextRetryAt(): Date | undefined {
    return this.etc.nextRetryAt;
  }

  get lockedUntil(): Date | undefined {
    return this.etc.lockedUntil;
  }

  get lastError(): string | undefined {
    return this.etc.lastError;
  }

  get occurredAt(): Date {
    return this.etc.occurredAt;
  }

  get publishedAt(): Date | undefined {
    return this.etc.publishedAt;
  }
}
