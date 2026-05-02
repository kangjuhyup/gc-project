import { Logging } from '@kangjuhyup/rvlog';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { RefreshTokenModel } from '@domain';
import { MemberEntity, RefreshTokenEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmRefreshTokenRepository {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: RefreshTokenModel): Promise<RefreshTokenModel> {
    const entity = PersistenceMapper.refreshTokenToEntity(model);
    entity.member = this.entityManager.getReference(MemberEntity, entity.member.id);
    const existing =
      model.id === undefined
        ? undefined
        : await this.entityManager.findOne(RefreshTokenEntity, { id: model.id });

    if (existing === undefined || existing === null) {
      entity.id = String(await this.entityManager.insert(RefreshTokenEntity, entity));
      return PersistenceMapper.refreshTokenToDomain(entity);
    }

    Object.assign(existing, entity);
    return PersistenceMapper.refreshTokenToDomain(existing);
  }

  async findById(id: string): Promise<RefreshTokenModel | undefined> {
    const entity = await this.entityManager.findOne(RefreshTokenEntity, { id });
    return entity ? PersistenceMapper.refreshTokenToDomain(entity) : undefined;
  }

  async findByToken(token: string): Promise<RefreshTokenModel | undefined> {
    const entity = await this.entityManager.findOne(RefreshTokenEntity, { token });
    return entity ? PersistenceMapper.refreshTokenToDomain(entity) : undefined;
  }

  async revokeActiveByMemberId(memberId: string, now: Date): Promise<number> {
    return this.entityManager.nativeUpdate(
      RefreshTokenEntity,
      {
        member: memberId,
        revokedAt: undefined,
      },
      {
        revokedAt: now,
        updatedAt: now,
      },
    );
  }
}
