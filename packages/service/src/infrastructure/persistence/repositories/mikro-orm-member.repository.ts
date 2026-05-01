import { Logging } from '@kangjuhyup/rvlog';
import type { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { MemberModel } from '@domain';
import type { MemberRepositoryPort } from '@application/commands/ports';
import type { MemberQueryPort } from '@application/query/ports';
import {
  AdminMemberListResultDto,
  AdminMemberSummaryDto,
  ListAdminMembersQuery,
} from '@application/query/dto';
import { MemberEntity } from '../entities';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmMemberRepository implements MemberRepositoryPort, MemberQueryPort {
  constructor(private readonly entityManager: EntityManager) {}

  async save(model: MemberModel): Promise<MemberModel> {
    const entity = PersistenceMapper.memberToEntity(model);
    const existing = model.id === undefined
      ? undefined
      : await this.entityManager.findOne(MemberEntity, { id: model.id });

    if (existing === undefined || existing === null) {
      entity.id = String(await this.entityManager.insert(MemberEntity, entity));
      return PersistenceMapper.memberToDomain(entity);
    }

    Object.assign(existing, entity);
    return PersistenceMapper.memberToDomain(existing);
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

  async listAdminMembers(query: ListAdminMembersQuery): Promise<AdminMemberListResultDto> {
    const [rows, totalCount] = await Promise.all([
      this.findAdminRows(query),
      this.countAdminRows(query),
    ]);

    return AdminMemberListResultDto.of({
      totalCount,
      currentPage: query.currentPage,
      countPerPage: query.countPerPage,
      items: rows.map((row) => this.toAdminDto(row)),
    });
  }

  private findAdminRows(query: ListAdminMembersQuery): Promise<MemberEntity[]> {
    return this.entityManager.find(MemberEntity, this.buildAdminWhere(query), {
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit: query.countPerPage,
      offset: this.offset(query.currentPage, query.countPerPage),
    });
  }

  private countAdminRows(query: ListAdminMembersQuery): Promise<number> {
    return this.entityManager.count(MemberEntity, this.buildAdminWhere(query));
  }

  private buildAdminWhere(query: ListAdminMembersQuery): FilterQuery<MemberEntity> {
    const where: FilterQuery<MemberEntity> = {};
    const normalizedKeyword = query.keyword?.trim();

    if (normalizedKeyword) {
      const keyword = `%${normalizedKeyword}%`;
      where.$or = [
        { userId: { $ilike: keyword } },
        { name: { $ilike: keyword } },
        { phoneNumber: { $ilike: keyword } },
      ];
    }

    if (query.status !== undefined) {
      where.status = query.status;
    }

    return where;
  }

  private toAdminDto(row: MemberEntity): AdminMemberSummaryDto {
    return AdminMemberSummaryDto.of({
      id: String(row.id),
      userId: row.userId,
      name: row.name,
      phoneNumber: row.phoneNumber,
      status: row.status,
      failedLoginCount: row.failedLoginCount,
      lockedAt: this.toOptionalIsoString(row.lockedAt),
      createdAt: this.toIsoString(row.createdAt),
    });
  }

  private offset(currentPage: number, countPerPage: number): number {
    return (currentPage - 1) * countPerPage;
  }

  private toIsoString(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }

  private toOptionalIsoString(value: string | Date | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.toIsoString(value);
  }
}
