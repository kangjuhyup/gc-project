import { Injectable } from '@nestjs/common';
import { RefreshTokenModel } from '@domain';
import {
  TokenType,
  type FindTokenSubjectParams,
  type RevokeSubjectTokensParams,
  type SaveTokenParams,
  type TokenRepositoryPort,
} from '@application/commands/ports';
import { RedisAccessTokenRepository } from '@infrastructure/cache';
import { MikroOrmRefreshTokenRepository } from '@infrastructure/persistence/repositories';

@Injectable()
export class RoutingTokenRepository implements TokenRepositoryPort {
  constructor(
    private readonly redisRepository: RedisAccessTokenRepository,
    private readonly dbRepository: MikroOrmRefreshTokenRepository,
  ) {}

  async save(params: SaveTokenParams): Promise<void> {
    if (params.type === TokenType.ACCESS) {
      await this.redisRepository.save({
        namespace: 'member',
        subjectId: params.subjectId,
        accessToken: params.token,
        ttlSeconds: params.ttlSeconds,
      });
      return;
    }

    if (params.type === TokenType.ADMIN_ACCESS) {
      await this.redisRepository.save({
        namespace: 'admin',
        subjectId: params.subjectId,
        accessToken: params.token,
        ttlSeconds: params.ttlSeconds,
      });
      return;
    }

    await this.dbRepository.save(
      RefreshTokenModel.issue({
        memberId: params.subjectId,
        token: params.token,
        expiresAt: params.expiresAt,
      }),
    );
  }

  async findSubjectId(params: FindTokenSubjectParams): Promise<string | undefined> {
    if (params.type === TokenType.ACCESS) {
      return this.redisRepository.findSubjectId('member', params.token);
    }

    if (params.type === TokenType.ADMIN_ACCESS) {
      return this.redisRepository.findSubjectId('admin', params.token);
    }

    return undefined;
  }

  async revokeActiveBySubjectId(params: RevokeSubjectTokensParams): Promise<number> {
    if (params.type === TokenType.ACCESS) {
      return this.redisRepository.revokeBySubjectId('member', params.subjectId);
    }

    if (params.type === TokenType.ADMIN_ACCESS) {
      return this.redisRepository.revokeBySubjectId('admin', params.subjectId);
    }

    return this.dbRepository.revokeActiveByMemberId(params.subjectId, params.now);
  }
}
