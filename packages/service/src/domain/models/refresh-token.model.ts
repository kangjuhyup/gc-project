import { PersistenceModel } from '@domain/shared';

export interface RefreshTokenPersistenceProps {
  readonly memberId: string;
  readonly token: string;
  readonly expiresAt: Date;
  readonly revokedAt?: Date;
}

export class RefreshTokenModel extends PersistenceModel<string, RefreshTokenPersistenceProps> {
  private constructor(props: RefreshTokenPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: RefreshTokenPersistenceProps): RefreshTokenModel {
    return new RefreshTokenModel(props);
  }

  static issue(params: { memberId: string; token: string; expiresAt: Date }): RefreshTokenModel {
    return new RefreshTokenModel({
      memberId: params.memberId,
      token: params.token,
      expiresAt: params.expiresAt,
    });
  }

  revoke(now: Date): RefreshTokenModel {
    if (this.revokedAt !== undefined) {
      return this;
    }

    return new RefreshTokenModel({
      ...this.etc,
      revokedAt: now,
    }).setPersistence(this.id, this.createdAt, now);
  }

  get memberId(): string {
    return this.etc.memberId;
  }

  get token(): string {
    return this.etc.token;
  }

  get expiresAt(): Date {
    return this.etc.expiresAt;
  }

  get revokedAt(): Date | undefined {
    return this.etc.revokedAt;
  }
}
