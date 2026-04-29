import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { PhoneVerificationModel } from '@domain';
import type { PhoneVerificationRepositoryPort } from '@application/commands/ports';
import { PhoneVerificationEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmPhoneVerificationRepository implements PhoneVerificationRepositoryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: PhoneVerificationModel): Promise<PhoneVerificationModel> {
    const entity = PersistenceMapper.phoneVerificationToEntity(model);
    const existing = model.id === undefined
      ? undefined
      : await this.entityManager.findOne(PhoneVerificationEntity, { id: model.id });

    if (existing === undefined || existing === null) {
      entity.id = String(await this.entityManager.insert(PhoneVerificationEntity, entity));
      return PersistenceMapper.phoneVerificationToDomain(entity);
    }

    Object.assign(existing, entity);
    return PersistenceMapper.phoneVerificationToDomain(existing);
  }

  async findById(id: string): Promise<PhoneVerificationModel | undefined> {
    const entity = await this.entityManager.findOne(PhoneVerificationEntity, { id });
    return entity ? PersistenceMapper.phoneVerificationToDomain(entity) : undefined;
  }

  async findVerifiedByPhoneNumber(phoneNumber: string): Promise<PhoneVerificationModel | undefined> {
    const entity = await this.entityManager.findOne(PhoneVerificationEntity, {
      phoneNumber,
      status: 'VERIFIED',
    });
    return entity ? PersistenceMapper.phoneVerificationToDomain(entity) : undefined;
  }
}
