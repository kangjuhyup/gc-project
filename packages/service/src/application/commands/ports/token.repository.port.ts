export const TOKEN_REPOSITORY = Symbol('TOKEN_REPOSITORY');

export const TokenType = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export interface SaveTokenParams {
  readonly type: TokenType;
  readonly memberId: string;
  readonly token: string;
  readonly ttlSeconds: number;
  readonly expiresAt: Date;
}

export interface FindTokenMemberParams {
  readonly type: TokenType;
  readonly token: string;
}

export interface RevokeMemberTokensParams {
  readonly type: TokenType;
  readonly memberId: string;
  readonly now: Date;
}

export interface TokenRepositoryPort {
  save(params: SaveTokenParams): Promise<void>;
  findMemberId(params: FindTokenMemberParams): Promise<string | undefined>;
  revokeActiveByMemberId(params: RevokeMemberTokensParams): Promise<number>;
}
