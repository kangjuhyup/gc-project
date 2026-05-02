import { Logging, NoLog } from '@kangjuhyup/rvlog';
import type { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { MemberStatus, type MemberModel } from '@domain';
import type { MemberRepositoryPort } from '@application/commands/ports';
import type { MemberQueryPort } from '@application/query/ports';
import {
  AdminMemberListResultDto,
  AdminMemberSummaryDto,
  ListAdminMembersQuery,
} from '@application/query/dto';
import { MemberEntity } from '../entities';
import { EntityEncryptionService } from '../encryption';
import { PersistenceMapper } from '../mappers';

@Injectable()
@Logging
export class MikroOrmMemberRepository implements MemberRepositoryPort, MemberQueryPort {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly encryption: EntityEncryptionService,
  ) {}

  async save(model: MemberModel): Promise<MemberModel> {
    const entity = this.encryptEntity(PersistenceMapper.memberToEntity(model));
    const existing =
      model.id === undefined
        ? undefined
        : await this.entityManager.findOne(MemberEntity, { id: model.id });

    if (existing === undefined || existing === null) {
      entity.id = String(await this.entityManager.insert(MemberEntity, entity));
      return this.toDomain(entity);
    }

    Object.assign(existing, entity);
    return this.toDomain(existing);
  }

  async findById(id: string): Promise<MemberModel | undefined> {
    const entity = await this.entityManager.findOne(MemberEntity, { id });
    return entity ? this.toDomain(entity) : undefined;
  }

  async findByUserId(userId: string): Promise<MemberModel | undefined> {
    const entity =
      (await this.findActiveByUserId(userId)) ??
      (await this.entityManager.findOne(MemberEntity, { userId }));

    return entity ? this.toDomain(entity) : undefined;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<MemberModel | undefined> {
    const entity = await this.entityManager.findOne(
      MemberEntity,
      this.activePhoneNumberFilter(phoneNumber),
    );
    return entity ? this.toDomain(entity) : undefined;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    return (await this.entityManager.count(MemberEntity, this.activeUserIdFilter(userId))) > 0;
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

  @NoLog
  private findActiveByUserId(userId: string): Promise<MemberEntity | null> {
    return this.entityManager.findOne(MemberEntity, this.activeUserIdFilter(userId));
  }

  @NoLog
  private activeUserIdFilter(userId: string): FilterQuery<MemberEntity> {
    return {
      userId,
      status: { $ne: MemberStatus.WITHDRAWN },
    };
  }

  @NoLog
  private activePhoneNumberFilter(phoneNumber: string): FilterQuery<MemberEntity> {
    return {
      phoneNumber: { $in: this.encryption.encryptedValueCandidates(phoneNumber) },
      status: { $ne: MemberStatus.WITHDRAWN },
    };
  }

  @NoLog
  private findAdminRows(query: ListAdminMembersQuery): Promise<MemberEntity[]> {
    return this.entityManager.find(MemberEntity, this.buildAdminWhere(query), {
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit: query.countPerPage,
      offset: this.offset(query.currentPage, query.countPerPage),
    });
  }

  @NoLog
  private countAdminRows(query: ListAdminMembersQuery): Promise<number> {
    return this.entityManager.count(MemberEntity, this.buildAdminWhere(query));
  }

  @NoLog
  private buildAdminWhere(query: ListAdminMembersQuery): FilterQuery<MemberEntity> {
    const where: FilterQuery<MemberEntity> = {};
    const normalizedKeyword = query.keyword?.trim();

    if (normalizedKeyword) {
      const keyword = `%${normalizedKeyword}%`;
      const keywordFilters: FilterQuery<MemberEntity>[] = [
        { userId: { $ilike: keyword } },
        { name: { $ilike: keyword } },
      ];
      const normalizedPhoneNumber = normalizedKeyword.replace(/\D/g, '');

      if (normalizedPhoneNumber.length >= 10) {
        keywordFilters.push({
          phoneNumber: { $in: this.encryption.encryptedValueCandidates(normalizedPhoneNumber) },
        });
      }

      where.$or = keywordFilters;
    }

    if (query.status !== undefined) {
      where.status = query.status;
    }

    return where;
  }

  @NoLog
  private toAdminDto(row: MemberEntity): AdminMemberSummaryDto {
    const decrypted = this.decryptEntity(row);
    return AdminMemberSummaryDto.of({
      id: String(decrypted.id),
      userId: decrypted.userId,
      name: decrypted.name,
      phoneNumber: decrypted.phoneNumber,
      status: decrypted.status,
      failedLoginCount: decrypted.failedLoginCount,
      lockedAt: this.toOptionalIsoString(decrypted.lockedAt),
      createdAt: this.toIsoString(decrypted.createdAt),
    });
  }

  @NoLog
  private toDomain(entity: MemberEntity): MemberModel {
    return PersistenceMapper.memberToDomain(this.decryptEntity(entity));
  }

  @NoLog
  private encryptEntity(entity: MemberEntity): MemberEntity {
    return this.encryption.encryptEntity(this.cloneEntity(entity));
  }

  @NoLog
  private decryptEntity(entity: MemberEntity): MemberEntity {
    return this.encryption.decryptEntity(this.cloneEntity(entity));
  }

  @NoLog
  private cloneEntity(entity: MemberEntity): MemberEntity {
    return Object.assign(new MemberEntity(), entity);
  }

  @NoLog
  private offset(currentPage: number, countPerPage: number): number {
    return (currentPage - 1) * countPerPage;
  }

  @NoLog
  private toIsoString(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }

  @NoLog
  private toOptionalIsoString(value: string | Date | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.toIsoString(value);
  }
}
