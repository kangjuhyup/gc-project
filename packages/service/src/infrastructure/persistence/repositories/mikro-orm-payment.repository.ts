import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentModel } from '@domain';
import { PaymentResultDto } from '@application/commands/dto';
import type { PaymentQueryPort } from '@application/query/ports';
import type { PaymentRepositoryPort } from '@application/commands/ports';
import { MemberEntity, PaymentEntity, PaymentSeatHoldEntity, ReservationEntity, SeatHoldEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmPaymentRepository implements PaymentRepositoryPort, PaymentQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: PaymentModel): Promise<PaymentModel> {
    const entity = PersistenceMapper.paymentToEntity(model);
    this.applyReferences(entity);
    const existing = model.id === undefined
      ? undefined
      : await this.entityManager.findOne(PaymentEntity, { id: model.id });

    if (existing === undefined || existing === null) {
      entity.id = String(await this.entityManager.insert(PaymentEntity, entity));
      await this.saveSeatHoldLinks(entity.id, model.seatHoldIds);
      return this.toDomain(entity, model.seatHoldIds);
    }

    Object.assign(existing, entity);
    await this.saveSeatHoldLinks(existing.id, model.seatHoldIds);
    return this.toDomain(existing, model.seatHoldIds);
  }

  async findById(id: string): Promise<PaymentModel | undefined> {
    const entity = await this.entityManager.findOne(PaymentEntity, { id });
    return entity ? this.toDomain(entity, await this.findSeatHoldIds(entity.id)) : undefined;
  }

  async findBySeatHoldId(seatHoldId: string): Promise<PaymentModel | undefined> {
    const [payment] = await this.findBySeatHoldIds([seatHoldId]);

    if (payment !== undefined) {
      return payment;
    }

    const entity = await this.entityManager.findOne(PaymentEntity, { seatHold: seatHoldId });
    return entity ? this.toDomain(entity, await this.findSeatHoldIds(entity.id)) : undefined;
  }

  async findBySeatHoldIds(seatHoldIds: string[]): Promise<PaymentModel[]> {
    if (seatHoldIds.length === 0) {
      return [];
    }

    const links = await this.entityManager.find(PaymentSeatHoldEntity, {
      seatHold: { $in: seatHoldIds },
    }, { populate: ['payment'] });
    const paymentsById = new Map<string, PaymentEntity>();

    for (const link of links) {
      paymentsById.set(link.payment.id, link.payment);
    }

    return Promise.all(
      [...paymentsById.values()].map(async (payment) => this.toDomain(payment, await this.findSeatHoldIds(payment.id))),
    );
  }

  async findByMemberIdAndIdempotencyKey(memberId: string, idempotencyKey: string): Promise<PaymentModel | undefined> {
    const entity = await this.entityManager.findOne(PaymentEntity, {
      member: memberId,
      idempotencyKey,
    });
    return entity ? this.toDomain(entity, await this.findSeatHoldIds(entity.id)) : undefined;
  }

  async findByIdForUpdate(id: string): Promise<PaymentModel | undefined> {
    const entity = await this.entityManager.findOne(
      PaymentEntity,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    return entity ? this.toDomain(entity, await this.findSeatHoldIds(entity.id)) : undefined;
  }

  async findByReservationIdForUpdate(reservationId: string): Promise<PaymentModel | undefined> {
    const entity = await this.entityManager.findOne(
      PaymentEntity,
      { reservation: reservationId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    return entity ? this.toDomain(entity, await this.findSeatHoldIds(entity.id)) : undefined;
  }

  async findPaymentById(params: { paymentId: string; memberId: string }): Promise<PaymentResultDto | undefined> {
    const entity = await this.entityManager.findOne(PaymentEntity, {
      id: params.paymentId,
      member: params.memberId,
    });
    return entity ? this.toDto(this.toDomain(entity, await this.findSeatHoldIds(entity.id))) : undefined;
  }

  async findSeatHoldIds(paymentId: string): Promise<string[]> {
    const links = await this.entityManager.find(PaymentSeatHoldEntity, {
      payment: paymentId,
    }, {
      orderBy: { id: 'ASC' },
      populate: ['seatHold'],
    });

    return links.map((link) => link.seatHold.id);
  }

  async saveSeatHoldLinks(paymentId: string, seatHoldIds: string[]): Promise<void> {
    const existingLinks = await this.entityManager.find(PaymentSeatHoldEntity, {
      payment: paymentId,
    }, { populate: ['seatHold'] });
    const existingSeatHoldIds = new Set(existingLinks.map((link) => link.seatHold.id));

    for (const seatHoldId of seatHoldIds) {
      if (existingSeatHoldIds.has(seatHoldId)) {
        continue;
      }

      const link = new PaymentSeatHoldEntity();
      link.payment = this.entityManager.getReference(PaymentEntity, paymentId);
      link.seatHold = this.entityManager.getReference(SeatHoldEntity, seatHoldId);
      await this.entityManager.insert(PaymentSeatHoldEntity, link);
    }
  }

  @NoLog
  private toDto(payment: PaymentModel): PaymentResultDto {
    return PaymentResultDto.of({
      paymentId: payment.id,
      seatHoldId: payment.seatHoldId,
      seatHoldIds: payment.seatHoldIds,
      idempotencyKey: payment.idempotencyKey,
      reservationId: payment.reservationId,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      status: payment.status,
      amount: payment.amount,
    });
  }

  @NoLog
  private applyReferences(entity: PaymentEntity): void {
    entity.member = this.entityManager.getReference(MemberEntity, entity.member.id);
    entity.seatHold = this.entityManager.getReference(SeatHoldEntity, entity.seatHold.id);
    entity.reservation = entity.reservation === undefined
      ? undefined
      : this.entityManager.getReference(ReservationEntity, entity.reservation.id);
  }

  @NoLog
  private toDomain(entity: PaymentEntity, seatHoldIds: string[]): PaymentModel {
    const payment = PersistenceMapper.paymentToDomain(entity);

    return PaymentModel.of({
      memberId: payment.memberId,
      seatHoldId: payment.seatHoldId,
      seatHoldIds: seatHoldIds.length > 0 ? seatHoldIds : [payment.seatHoldId],
      idempotencyKey: payment.idempotencyKey,
      requestHash: payment.requestHash,
      reservationId: payment.reservationId,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      amount: payment.amount,
      status: payment.status,
      requestedAt: payment.requestedAt,
      approvedAt: payment.approvedAt,
      failedAt: payment.failedAt,
      refundedAt: payment.refundedAt,
      failureReason: payment.failureReason,
    }).setPersistence(payment.id, payment.createdAt, payment.updatedAt);
  }
}
