import { Logging } from '@kangjuhyup/rvlog';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { PaymentModel } from '@domain';
import { PaymentResultDto } from '@application/commands/dto';
import type { PaymentQueryPort } from '@application/query/ports';
import type { PaymentRepositoryPort } from '@application/commands/ports';
import { MemberEntity, PaymentEntity, ReservationEntity, SeatHoldEntity } from '../entities';
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
      return PersistenceMapper.paymentToDomain(entity);
    }

    Object.assign(existing, entity);
    return PersistenceMapper.paymentToDomain(existing);
  }

  async findById(id: string): Promise<PaymentModel | undefined> {
    const entity = await this.entityManager.findOne(PaymentEntity, { id });
    return entity ? PersistenceMapper.paymentToDomain(entity) : undefined;
  }

  async findBySeatHoldId(seatHoldId: string): Promise<PaymentModel | undefined> {
    const entity = await this.entityManager.findOne(PaymentEntity, { seatHold: seatHoldId });
    return entity ? PersistenceMapper.paymentToDomain(entity) : undefined;
  }

  async findByMemberIdAndIdempotencyKey(memberId: string, idempotencyKey: string): Promise<PaymentModel | undefined> {
    const entity = await this.entityManager.findOne(PaymentEntity, {
      member: memberId,
      idempotencyKey,
    });
    return entity ? PersistenceMapper.paymentToDomain(entity) : undefined;
  }

  async findByIdForUpdate(id: string): Promise<PaymentModel | undefined> {
    const entity = await this.entityManager.findOne(
      PaymentEntity,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    return entity ? PersistenceMapper.paymentToDomain(entity) : undefined;
  }

  async findPaymentById(params: { paymentId: string; memberId: string }): Promise<PaymentResultDto | undefined> {
    const entity = await this.entityManager.findOne(PaymentEntity, {
      id: params.paymentId,
      member: params.memberId,
    });
    return entity ? this.toDto(PersistenceMapper.paymentToDomain(entity)) : undefined;
  }

  private toDto(payment: PaymentModel): PaymentResultDto {
    return PaymentResultDto.of({
      paymentId: payment.id,
      seatHoldId: payment.seatHoldId,
      idempotencyKey: payment.idempotencyKey,
      reservationId: payment.reservationId,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      status: payment.status,
      amount: payment.amount,
    });
  }

  private applyReferences(entity: PaymentEntity): void {
    entity.member = this.entityManager.getReference(MemberEntity, entity.member.id);
    entity.seatHold = this.entityManager.getReference(SeatHoldEntity, entity.seatHold.id);
    entity.reservation = entity.reservation === undefined
      ? undefined
      : this.entityManager.getReference(ReservationEntity, entity.reservation.id);
  }
}
