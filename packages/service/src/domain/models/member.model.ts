import { PersistenceModel } from '@domain/shared';
import { MemberStatus, type MemberStatusType } from '@domain/property';
import { DomainError, DomainErrorCode } from '@domain/errors';

export interface MemberPersistenceProps {
  readonly userId: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly birthDate: Date;
  readonly phoneNumber: string;
  readonly address: string;
  readonly status: MemberStatusType;
  readonly failedLoginCount: number;
  readonly lockedAt?: Date;
}

export class MemberModel extends PersistenceModel<string, MemberPersistenceProps> {
  private constructor(props: MemberPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: MemberPersistenceProps): MemberModel {
    return new MemberModel(props);
  }

  static register(params: {
    userId: string;
    passwordHash: string;
    name: string;
    birthDate: Date;
    phoneNumber: string;
    address: string;
  }): MemberModel {
    if (!/^[a-z][a-z0-9_]{3,19}$/.test(params.userId)) {
      throw new DomainError(DomainErrorCode.INVALID_USER_ID);
    }

    if (params.passwordHash.trim().length === 0) {
      throw new DomainError(DomainErrorCode.INVALID_PASSWORD_HASH);
    }

    if (params.name.trim().length === 0) {
      throw new DomainError(DomainErrorCode.INVALID_MEMBER_NAME);
    }

    if (!/^\d{10,11}$/.test(params.phoneNumber)) {
      throw new DomainError(DomainErrorCode.INVALID_PHONE_NUMBER);
    }

    if (params.address.trim().length === 0) {
      throw new DomainError(DomainErrorCode.INVALID_ADDRESS);
    }

    return new MemberModel({
      userId: params.userId,
      passwordHash: params.passwordHash,
      name: params.name,
      birthDate: params.birthDate,
      phoneNumber: params.phoneNumber,
      address: params.address,
      status: MemberStatus.ACTIVE,
      failedLoginCount: 0,
    });
  }

  recordLoginFailure(now: Date): MemberModel {
    const failedLoginCount = this.etc.failedLoginCount + 1;
    const locked = failedLoginCount >= 5;
    return new MemberModel({
      ...this.etc,
      failedLoginCount,
      status: locked ? MemberStatus.LOCKED : this.etc.status,
      lockedAt: locked ? now : this.etc.lockedAt,
    }).setPersistence(this.id, this.createdAt, now);
  }

  assertCanLogin(): void {
    if (this.status === MemberStatus.LOCKED) {
      throw new Error('MEMBER_LOCKED');
    }

    if (this.status === MemberStatus.WITHDRAWN) {
      throw new Error('MEMBER_WITHDRAWN');
    }
  }

  recordLoginSuccess(now: Date): MemberModel {
    return new MemberModel({
      ...this.etc,
      failedLoginCount: 0,
    }).setPersistence(this.id, this.createdAt, now);
  }

  unlock(now: Date): MemberModel {
    return new MemberModel({
      ...this.etc,
      status: MemberStatus.ACTIVE,
      failedLoginCount: 0,
      lockedAt: undefined,
    }).setPersistence(this.id, this.createdAt, now);
  }

  issueTemporaryPassword(params: { passwordHash: string; now: Date }): MemberModel {
    if (params.passwordHash.trim().length === 0) {
      throw new DomainError(DomainErrorCode.INVALID_PASSWORD_HASH);
    }

    return new MemberModel({
      ...this.etc,
      passwordHash: params.passwordHash,
      status: MemberStatus.ACTIVE,
      failedLoginCount: 0,
      lockedAt: undefined,
    }).setPersistence(this.id, this.createdAt, params.now);
  }

  changePassword(params: { passwordHash: string; now: Date }): MemberModel {
    if (params.passwordHash.trim().length === 0) {
      throw new DomainError(DomainErrorCode.INVALID_PASSWORD_HASH);
    }

    return new MemberModel({
      ...this.etc,
      passwordHash: params.passwordHash,
    }).setPersistence(this.id, this.createdAt, params.now);
  }

  withdraw(now: Date): MemberModel {
    if (this.status === MemberStatus.WITHDRAWN) {
      throw new Error('MEMBER_ALREADY_WITHDRAWN');
    }

    return new MemberModel({
      ...this.etc,
      status: MemberStatus.WITHDRAWN,
      failedLoginCount: 0,
      lockedAt: undefined,
    }).setPersistence(this.id, this.createdAt, now);
  }

  get userId(): string {
    return this.etc.userId;
  }

  get passwordHash(): string {
    return this.etc.passwordHash;
  }

  get name(): string {
    return this.etc.name;
  }

  get birthDate(): Date {
    return this.etc.birthDate;
  }

  get phoneNumber(): string {
    return this.etc.phoneNumber;
  }

  get address(): string {
    return this.etc.address;
  }

  get status(): MemberStatusType {
    return this.etc.status;
  }

  get failedLoginCount(): number {
    return this.etc.failedLoginCount;
  }

  get lockedAt(): Date | undefined {
    return this.etc.lockedAt;
  }
}
