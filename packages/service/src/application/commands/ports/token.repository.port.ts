export const TOKEN_REPOSITORY = Symbol('TOKEN_REPOSITORY');

export const TokenType = {
  ACCESS: 'ACCESS',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  REFRESH: 'REFRESH',
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export interface SaveTokenParams {
  readonly type: TokenType;
  readonly subjectId: string;
  readonly token: string;
  readonly ttlSeconds: number;
  readonly expiresAt: Date;
}

export interface FindTokenSubjectParams {
  readonly type: TokenType;
  readonly token: string;
}

export interface RevokeSubjectTokensParams {
  readonly type: TokenType;
  readonly subjectId: string;
  readonly now: Date;
}

export interface TokenRepositoryPort {
  save(params: SaveTokenParams): Promise<void>;
  findSubjectId(params: FindTokenSubjectParams): Promise<string | undefined>;
  revokeActiveBySubjectId(params: RevokeSubjectTokensParams): Promise<number>;
}
