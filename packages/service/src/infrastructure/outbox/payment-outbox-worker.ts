import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { OutboxEventModel, PaymentEventLogModel, PaymentEventType } from '@domain';
import type {
  ClockPort,
  OutboxEventRepositoryPort,
  PaymentEventLogRepositoryPort,
  PaymentGatewayPort,
  PaymentRepositoryPort,
  TransactionManagerPort,
} from '@application/commands/ports';

export interface PaymentOutboxWorkerOptions {
  readonly enabled: boolean;
  readonly intervalMilliseconds: number;
}

@Injectable()
export class PaymentOutboxWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private interval?: NodeJS.Timeout;
  private processing = false;

  constructor(
    private readonly outboxEventRepository: OutboxEventRepositoryPort,
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly paymentEventLogRepository: PaymentEventLogRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly transactionManager: TransactionManagerPort,
    private readonly clock: ClockPort,
    private readonly orm: MikroORM,
    private readonly options: PaymentOutboxWorkerOptions,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.options.enabled) {
      return;
    }

    this.start();
  }

  onApplicationShutdown(): void {
    this.stop();
  }

  start(): void {
    if (this.interval !== undefined) {
      return;
    }

    void this.processSafely();
    this.interval = setInterval(
      () => void this.processSafely(),
      this.options.intervalMilliseconds,
    );
  }

  stop(): void {
    if (this.interval === undefined) {
      return;
    }

    clearInterval(this.interval);
    this.interval = undefined;
  }

  async processOnce(limit = 20): Promise<{ processed: number; failed: number }> {
    const events = await this.outboxEventRepository.findPublishable({
      now: this.clock.now(),
      limit,
    });
    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.processEvent(event);
        processed += 1;
      } catch {
        failed += 1;
      }
    }

    return { processed, failed };
  }

  private async processSafely(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      await RequestContext.create(this.orm.em, () => this.processOnce());
    } finally {
      this.processing = false;
    }
  }

  private async processEvent(event: OutboxEventModel): Promise<void> {
    await this.transactionManager.runInTransaction(async () => {
      const processing = event.markProcessing({
        lockedUntil: new Date(this.clock.now().getTime() + 30_000),
        now: this.clock.now(),
      });
      await this.outboxEventRepository.save(processing);

      try {
        await this.publish(processing);
        await this.outboxEventRepository.save(
          processing.markPublished({ now: this.clock.now() }),
        );
      } catch (error) {
        await this.outboxEventRepository.save(
          processing.markFailed({
            error: error instanceof Error ? error.message : 'OUTBOX_PUBLISH_FAILED',
            nextRetryAt: new Date(this.clock.now().getTime() + 60_000),
            now: this.clock.now(),
          }),
        );
        throw error;
      }
    });
  }

  private async publish(event: OutboxEventModel): Promise<void> {
    if (event.eventType === PaymentEventType.PAYMENT_REQUESTED) {
      await this.requestPayment(event);
      return;
    }

    if (event.eventType === PaymentEventType.PAYMENT_REFUND_REQUESTED) {
      await this.refundPayment(event);
    }
  }

  private async requestPayment(event: OutboxEventModel): Promise<void> {
    const payment = await this.paymentRepository.findById(event.aggregateId);

    if (payment === undefined) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    await this.paymentGateway.request({
      paymentId: payment.id,
      provider: payment.provider,
      amount: payment.amount,
    });
  }

  private async refundPayment(event: OutboxEventModel): Promise<void> {
    const payment = await this.paymentRepository.findByIdForUpdate(event.aggregateId);

    if (payment === undefined) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.providerPaymentId === undefined) {
      throw new Error('PAYMENT_PROVIDER_PAYMENT_ID_REQUIRED');
    }

    const providerPaymentId = payment.providerPaymentId;
    const refunding = payment.startRefund({ now: this.clock.now() });
    await this.paymentRepository.save(refunding);
    const refund = await this.paymentGateway.refund({
      paymentId: refunding.id,
      provider: refunding.provider,
      providerPaymentId,
      amount: refunding.amount,
    });
    const nextPayment = refund.refunded
      ? refunding.completeRefund({ now: this.clock.now() })
      : refunding.failRefund({
          reason: refund.reason ?? 'PAYMENT_REFUND_FAILED',
          now: this.clock.now(),
        });
    await this.paymentRepository.save(nextPayment);
    await this.paymentEventLogRepository.save(
      PaymentEventLogModel.of({
        paymentId: nextPayment.id,
        eventType: refund.refunded
          ? PaymentEventType.PAYMENT_REFUNDED
          : PaymentEventType.PAYMENT_REFUND_FAILED,
        previousStatus: refunding.status,
        nextStatus: nextPayment.status,
        provider: nextPayment.provider,
        providerPaymentId: nextPayment.providerPaymentId,
        amount: nextPayment.amount,
        reason: nextPayment.failureReason,
        occurredAt: this.clock.now(),
      }),
    );
  }
}
