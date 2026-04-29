import { describe, expect, it, vi } from 'vitest';
import { LockMode } from '@mikro-orm/core';
import { PaymentEntity } from '@infrastructure/persistence/entities';
import { MikroOrmOutboxEventRepository, MikroOrmPaymentRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmPaymentRepository', () => {
  it('결제 조회 결과를 API 응답 DTO로 매핑한다', async () => {
    const requestedAt = new Date('2026-04-29T01:00:00.000Z');
    const entity = new PaymentEntity();
    entity.id = '7001';
    entity.member = { id: '1' } as never;
    entity.seatHold = { id: '9001' } as never;
    entity.idempotencyKey = 'pay-test-key';
    entity.provider = 'LOCAL';
    entity.providerPaymentId = 'local-payment-7001';
    entity.amount = 15000;
    entity.status = 'PENDING';
    entity.requestedAt = requestedAt;
    entity.createdAt = requestedAt;
    entity.updatedAt = requestedAt;
    const entityManager = {
      findOne: vi.fn().mockResolvedValue(entity),
    };
    const repository = new MikroOrmPaymentRepository(entityManager as never);

    const result = await repository.findPaymentById({ paymentId: '7001', memberId: '1' });

    expect(entityManager.findOne).toHaveBeenCalledWith(PaymentEntity, { id: '7001', member: '1' });
    expect(result?.paymentId).toBe('7001');
    expect(result?.seatHoldId).toBe('9001');
    expect(result?.idempotencyKey).toBe('pay-test-key');
    expect(result?.provider).toBe('LOCAL');
    expect(result?.providerPaymentId).toBe('local-payment-7001');
    expect(result?.status).toBe('PENDING');
    expect(result?.amount).toBe(15000);
  });

  it('회원과 멱등성 키로 기존 결제를 조회한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValue(undefined),
    };
    const repository = new MikroOrmPaymentRepository(entityManager as never);

    await repository.findByMemberIdAndIdempotencyKey('1', 'pay-test-key');

    expect(entityManager.findOne).toHaveBeenCalledWith(PaymentEntity, {
      member: '1',
      idempotencyKey: 'pay-test-key',
    });
  });

  it('결제 callback 처리를 위해 비관적 락으로 결제 row를 조회한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValue(undefined),
    };
    const repository = new MikroOrmPaymentRepository(entityManager as never);

    await repository.findByIdForUpdate('7001');

    expect(entityManager.findOne).toHaveBeenCalledWith(
      PaymentEntity,
      { id: '7001' },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });
});

describe('MikroOrmOutboxEventRepository', () => {
  it('발행 가능한 PENDING/FAILED 아웃박스 이벤트를 오래된 순으로 조회한다', async () => {
    const now = new Date('2026-04-29T01:00:00.000Z');
    const entityManager = {
      find: vi.fn().mockResolvedValue([]),
    };
    const repository = new MikroOrmOutboxEventRepository(entityManager as never);

    const result = await repository.findPublishable({ now, limit: 10 });

    expect(entityManager.find).toHaveBeenCalledWith(
      expect.any(Function),
      {
        status: { $in: ['PENDING', 'FAILED'] },
        $or: [
          { nextRetryAt: undefined },
          { nextRetryAt: { $lte: now } },
        ],
      },
      {
        limit: 10,
        orderBy: { occurredAt: 'ASC' },
      },
    );
    expect(result).toEqual([]);
  });
});
