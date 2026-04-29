import { Injectable } from '@nestjs/common';
import { RefreshTokenModel } from '@domain';
import {
  TokenType,
  type FindTokenMemberParams,
  type RevokeMemberTokensParams,
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
        memberId: params.memberId,
        accessToken: params.token,
        ttlSeconds: params.ttlSeconds,
      });
      return;
    }

    await this.dbRepository.save(
      RefreshTokenModel.issue({
        memberId: params.memberId,
        token: params.token,
        expiresAt: params.expiresAt,
      }),
    );
  }

  async findMemberId(params: FindTokenMemberParams): Promise<string | undefined> {
    if (params.type === TokenType.ACCESS) {
      return this.redisRepository.findMemberId(params.token);
    }

    return undefined;
  }

  async revokeActiveByMemberId(params: RevokeMemberTokensParams): Promise<number> {
    if (params.type === TokenType.ACCESS) {
      return this.redisRepository.revokeByMemberId(params.memberId);
    }

    return this.dbRepository.revokeActiveByMemberId(params.memberId, params.now);
  }
}
