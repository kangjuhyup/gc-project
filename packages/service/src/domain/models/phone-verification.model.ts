import { PersistenceModel } from '../shared';

export type PhoneVerificationStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED';

export interface PhoneVerificationPersistenceProps {
  readonly phoneNumber: string;
  readonly code: string;
  readonly status: PhoneVerificationStatus;
  readonly expiresAt: Date;
  readonly verifiedAt?: Date;
}

export class PhoneVerificationModel extends PersistenceModel<string, PhoneVerificationPersistenceProps> {
  private constructor(props: PhoneVerificationPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: PhoneVerificationPersistenceProps): PhoneVerificationModel {
    return new PhoneVerificationModel(props);
  }

  static issue(params: { phoneNumber: string; code: string; expiresAt: Date }): PhoneVerificationModel {
    if (!/^\d{10,11}$/.test(params.phoneNumber)) {
      throw new Error('INVALID_PHONE_NUMBER');
    }

    if (!/^\d{6}$/.test(params.code)) {
      throw new Error('INVALID_VERIFICATION_CODE');
    }

    return new PhoneVerificationModel({
      phoneNumber: params.phoneNumber,
      code: params.code,
      status: 'PENDING',
      expiresAt: params.expiresAt,
    });
  }

  confirm(params: { phoneNumber: string; code: string; now: Date }): PhoneVerificationModel {
    if (this.etc.status !== 'PENDING') {
      throw new Error('PHONE_VERIFICATION_NOT_PENDING');
    }

    if (this.etc.expiresAt.getTime() <= params.now.getTime()) {
      throw new Error('PHONE_VERIFICATION_EXPIRED');
    }

    if (this.etc.phoneNumber !== params.phoneNumber || this.etc.code !== params.code) {
      throw new Error('PHONE_VERIFICATION_CODE_MISMATCH');
    }

    return new PhoneVerificationModel({
      ...this.etc,
      status: 'VERIFIED',
      verifiedAt: params.now,
    }).setPersistence(this.id, this.createdAt, params.now);
  }

  get phoneNumber(): string {
    return this.etc.phoneNumber;
  }

  get code(): string {
    return this.etc.code;
  }

  get status(): PhoneVerificationStatus {
    return this.etc.status;
  }

  get expiresAt(): Date {
    return this.etc.expiresAt;
  }

  get verifiedAt(): Date | undefined {
    return this.etc.verifiedAt;
  }
}
