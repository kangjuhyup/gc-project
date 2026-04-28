import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { MemberModel } from '@domain';
import type { MemberRepositoryPort } from '@application/commands/ports';
import type { MemberQueryPort } from '@application/query/ports';
import { MemberEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
export class MikroOrmMemberRepository implements MemberRepositoryPort, MemberQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: MemberModel): Promise<MemberModel> {
    const entity = PersistenceMapper.memberToEntity(model);
    this.entityManager.persist(entity);
    await this.entityManager.flush();
    return PersistenceMapper.memberToDomain(entity);
  }

  async findById(id: string): Promise<MemberModel | undefined> {
    const entity = await this.entityManager.findOne(MemberEntity, { id });
    return entity ? PersistenceMapper.memberToDomain(entity) : undefined;
  }

  async findByUserId(userId: string): Promise<MemberModel | undefined> {
    const entity = await this.entityManager.findOne(MemberEntity, { userId });
    return entity ? PersistenceMapper.memberToDomain(entity) : undefined;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<MemberModel | undefined> {
    const entity = await this.entityManager.findOne(MemberEntity, { phoneNumber });
    return entity ? PersistenceMapper.memberToDomain(entity) : undefined;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    return (await this.entityManager.count(MemberEntity, { userId })) > 0;
  }
}
