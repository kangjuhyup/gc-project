import { PersistenceModel } from '@domain/shared';
import { PhoneVerificationStatus, type PhoneVerificationStatusType } from '@domain/property';
import { DomainError, DomainErrorCode } from '@domain/errors';

export interface PhoneVerificationPersistenceProps {
  readonly phoneNumber: string;
  readonly code: string;
  readonly status: PhoneVerificationStatusType;
  readonly expiresAt: Date;
  readonly verifiedAt?: Date;
}

export class PhoneVerificationModel extends PersistenceModel<
  string,
  PhoneVerificationPersistenceProps
> {
  private constructor(props: PhoneVerificationPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: PhoneVerificationPersistenceProps): PhoneVerificationModel {
    return new PhoneVerificationModel(props);
  }

  static issue(params: {
    phoneNumber: string;
    code: string;
    expiresAt: Date;
  }): PhoneVerificationModel {
    if (!/^\d{10,11}$/.test(params.phoneNumber)) {
      throw new DomainError(DomainErrorCode.INVALID_PHONE_NUMBER);
    }

    if (!/^\d{6}$/.test(params.code)) {
      throw new DomainError(DomainErrorCode.INVALID_VERIFICATION_CODE);
    }

    return new PhoneVerificationModel({
      phoneNumber: params.phoneNumber,
      code: params.code,
      status: PhoneVerificationStatus.PENDING,
      expiresAt: params.expiresAt,
    });
  }

  confirm(params: { phoneNumber: string; code: string; now: Date }): PhoneVerificationModel {
    if (this.etc.status !== PhoneVerificationStatus.PENDING) {
      throw new DomainError(DomainErrorCode.PHONE_VERIFICATION_NOT_PENDING);
    }

    if (this.etc.expiresAt.getTime() <= params.now.getTime()) {
      throw new DomainError(DomainErrorCode.PHONE_VERIFICATION_EXPIRED);
    }

    if (this.etc.phoneNumber !== params.phoneNumber || this.etc.code !== params.code) {
      throw new DomainError(DomainErrorCode.PHONE_VERIFICATION_CODE_MISMATCH);
    }

    return new PhoneVerificationModel({
      ...this.etc,
      status: PhoneVerificationStatus.VERIFIED,
      verifiedAt: params.now,
    }).setPersistence(this.id, this.createdAt, params.now);
  }

  get phoneNumber(): string {
    return this.etc.phoneNumber;
  }

  get code(): string {
    return this.etc.code;
  }

  get status(): PhoneVerificationStatusType {
    return this.etc.status;
  }

  get expiresAt(): Date {
    return this.etc.expiresAt;
  }

  get verifiedAt(): Date | undefined {
    return this.etc.verifiedAt;
  }
}
