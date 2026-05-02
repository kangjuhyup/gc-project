import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { OutboxEventModel } from '@domain';
import type { OutboxEventRepositoryPort } from '@application/commands/ports';
import { OutboxEventEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmOutboxEventRepository implements OutboxEventRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: OutboxEventModel): Promise<OutboxEventModel> {
    const entity = PersistenceMapper.outboxEventToEntity(model);

    if (model.id !== undefined) {
      await this.entityManager.nativeUpdate(
        OutboxEventEntity,
        { id: model.id },
        {
          aggregateType: entity.aggregateType,
          aggregateId: entity.aggregateId,
          eventType: entity.eventType,
          payload: entity.payload,
          status: entity.status,
          retryCount: entity.retryCount,
          nextRetryAt: entity.nextRetryAt,
          lockedUntil: entity.lockedUntil,
          lastError: entity.lastError,
          occurredAt: entity.occurredAt,
          publishedAt: entity.publishedAt,
          updatedAt: entity.updatedAt,
        },
      );
      return PersistenceMapper.outboxEventToDomain(entity);
    }

    entity.id = String(await this.entityManager.insert(OutboxEventEntity, entity));
    return PersistenceMapper.outboxEventToDomain(entity);
  }

  async findById(id: string): Promise<OutboxEventModel | undefined> {
    const entity = await this.entityManager.findOne(OutboxEventEntity, { id });
    return entity ? PersistenceMapper.outboxEventToDomain(entity) : undefined;
  }

  async findPublishable(params: { now: Date; limit: number }): Promise<OutboxEventModel[]> {
    const entities = await this.entityManager.find(
      OutboxEventEntity,
      {
        status: { $in: ['PENDING', 'FAILED'] },
        $or: [{ nextRetryAt: undefined }, { nextRetryAt: { $lte: params.now } }],
      },
      {
        limit: params.limit,
        orderBy: { occurredAt: 'ASC' },
      },
    );

    return entities.map((entity) => PersistenceMapper.outboxEventToDomain(entity));
  }
}
