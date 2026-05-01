import { Logging } from '@kangjuhyup/rvlog';
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

interface AdminMemberListRow {
  id: string | number;
  userId: string;
  name: string;
  phoneNumber: string;
  status: string;
  failedLoginCount: string | number;
  lockedAt?: string | Date;
  createdAt: string | Date;
}

interface AdminMemberCursor {
  createdAt: string;
  id: number;
}

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
    const cursor = this.decodeCursor(query.cursor);
    const rows = await this.findAdminRows(query, cursor);
    const hasNext = rows.length > query.limit;
    const items = rows.slice(0, query.limit);

    return AdminMemberListResultDto.of({
      items: items.map((row) => this.toAdminDto(row)),
      hasNext,
      nextCursor: hasNext ? this.encodeCursor(items[items.length - 1]) : undefined,
    });
  }

  private async findAdminRows(
    query: ListAdminMembersQuery,
    cursor?: AdminMemberCursor,
  ): Promise<AdminMemberListRow[]> {
    const params: Array<string | number> = [];
    const where: string[] = [];
    const normalizedKeyword = query.keyword?.trim();

    if (normalizedKeyword) {
      const keyword = `%${normalizedKeyword}%`;
      where.push('(user_id ILIKE ? OR name ILIKE ? OR phone_number ILIKE ?)');
      params.push(keyword, keyword, keyword);
    }

    if (query.status !== undefined) {
      where.push('status = ?');
      params.push(query.status);
    }

    const cursorWhere = this.buildCursorWhere(cursor, where.length > 0, params);
    params.push(query.limit + 1);

    return this.entityManager.execute<AdminMemberListRow[]>(
      `
        SELECT
          id::text AS "id",
          user_id AS "userId",
          name,
          phone_number AS "phoneNumber",
          status,
          failed_login_count AS "failedLoginCount",
          locked_at AS "lockedAt",
          created_at AS "createdAt"
        FROM member
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ${cursorWhere}
        ORDER BY created_at DESC, id DESC
        LIMIT ?
      `,
      params,
    );
  }

  private buildCursorWhere(
    cursor: AdminMemberCursor | undefined,
    hasWhere: boolean,
    params: Array<string | number>,
  ): string {
    if (cursor === undefined) {
      return '';
    }

    params.push(cursor.createdAt, cursor.createdAt, cursor.id);

    return `
      ${hasWhere ? 'AND' : 'WHERE'} (
        created_at < ?::timestamptz
        OR (created_at = ?::timestamptz AND id < ?)
      )
    `;
  }

  private toAdminDto(row: AdminMemberListRow): AdminMemberSummaryDto {
    return AdminMemberSummaryDto.of({
      id: String(row.id),
      userId: row.userId,
      name: row.name,
      phoneNumber: row.phoneNumber,
      status: row.status,
      failedLoginCount: Number(row.failedLoginCount),
      lockedAt: this.toOptionalIsoString(row.lockedAt),
      createdAt: this.toIsoString(row.createdAt),
    });
  }

  private encodeCursor(row: AdminMemberListRow | undefined): string | undefined {
    if (row === undefined) {
      return undefined;
    }

    return Buffer.from(
      JSON.stringify({
        createdAt: this.toIsoString(row.createdAt),
        id: Number(row.id),
      } satisfies AdminMemberCursor),
      'utf8',
    ).toString('base64url');
  }

  private decodeCursor(cursor: string | undefined): AdminMemberCursor | undefined {
    if (cursor === undefined) {
      return undefined;
    }

    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Partial<AdminMemberCursor>;

      if (typeof decoded.createdAt !== 'string' || typeof decoded.id !== 'number') {
        throw new Error('INVALID_MEMBER_CURSOR');
      }

      return {
        createdAt: decoded.createdAt,
        id: decoded.id,
      };
    } catch {
      throw new Error('INVALID_MEMBER_CURSOR');
    }
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
