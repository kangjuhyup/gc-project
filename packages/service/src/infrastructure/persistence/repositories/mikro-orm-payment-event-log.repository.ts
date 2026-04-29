import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { PaymentEventLogModel } from '@domain';
import type { PaymentEventLogRepositoryPort } from '@application/commands/ports';
import { PaymentEventLogEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmPaymentEventLogRepository implements PaymentEventLogRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: PaymentEventLogModel): Promise<PaymentEventLogModel> {
    const entity = PersistenceMapper.paymentEventLogToEntity(model);
    this.entityManager.persist(entity);
    await this.entityManager.flush();
    return PersistenceMapper.paymentEventLogToDomain(entity);
  }

  async findById(id: string): Promise<PaymentEventLogModel | undefined> {
    const entity = await this.entityManager.findOne(PaymentEventLogEntity, { id });
    return entity ? PersistenceMapper.paymentEventLogToDomain(entity) : undefined;
  }
}
