import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { PhoneVerificationModel } from '@domain';
import type { PhoneVerificationRepositoryPort } from '@application/commands/ports';
import { PhoneVerificationEntity } from '../entities';
import { EntityEncryptionService } from '../encryption';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmPhoneVerificationRepository implements PhoneVerificationRepositoryPort {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly encryption: EntityEncryptionService,
  ) {}

  async save(model: PhoneVerificationModel): Promise<PhoneVerificationModel> {
    const entity = this.encryptEntity(PersistenceMapper.phoneVerificationToEntity(model));
    const existing = model.id === undefined
      ? undefined
      : await this.entityManager.findOne(PhoneVerificationEntity, { id: model.id });

    if (existing === undefined || existing === null) {
      entity.id = String(await this.entityManager.insert(PhoneVerificationEntity, entity));
      return this.toDomain(entity);
    }

    Object.assign(existing, entity);
    return this.toDomain(existing);
  }

  async findById(id: string): Promise<PhoneVerificationModel | undefined> {
    const entity = await this.entityManager.findOne(PhoneVerificationEntity, { id });
    return entity ? this.toDomain(entity) : undefined;
  }

  async findVerifiedByPhoneNumber(phoneNumber: string): Promise<PhoneVerificationModel | undefined> {
    const entity = await this.entityManager.findOne(PhoneVerificationEntity, {
      phoneNumber: { $in: this.encryption.encryptedValueCandidates(phoneNumber) },
      status: 'VERIFIED',
    });
    return entity ? this.toDomain(entity) : undefined;
  }

  @NoLog
  private toDomain(entity: PhoneVerificationEntity): PhoneVerificationModel {
    return PersistenceMapper.phoneVerificationToDomain(this.decryptEntity(entity));
  }

  @NoLog
  private encryptEntity(entity: PhoneVerificationEntity): PhoneVerificationEntity {
    return this.encryption.encryptEntity(this.cloneEntity(entity));
  }

  @NoLog
  private decryptEntity(entity: PhoneVerificationEntity): PhoneVerificationEntity {
    return this.encryption.decryptEntity(this.cloneEntity(entity));
  }

  @NoLog
  private cloneEntity(entity: PhoneVerificationEntity): PhoneVerificationEntity {
    return Object.assign(new PhoneVerificationEntity(), entity);
  }
}
