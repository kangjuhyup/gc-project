import { PersistenceModel } from '../shared';

export type MemberStatus = 'ACTIVE' | 'DORMANT' | 'WITHDRAWN';

export interface MemberPersistenceProps {
  readonly userId: string;
  readonly name: string;
  readonly birthDate: Date;
  readonly phoneNumber: string;
  readonly address: string;
  readonly status: MemberStatus;
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
    name: string;
    birthDate: Date;
    phoneNumber: string;
    address: string;
  }): MemberModel {
    if (!/^[a-z][a-z0-9_]{3,19}$/.test(params.userId)) {
      throw new Error('INVALID_USER_ID');
    }

    if (params.name.trim().length === 0) {
      throw new Error('INVALID_MEMBER_NAME');
    }

    if (!/^\d{10,11}$/.test(params.phoneNumber)) {
      throw new Error('INVALID_PHONE_NUMBER');
    }

    if (params.address.trim().length === 0) {
      throw new Error('INVALID_ADDRESS');
    }

    return new MemberModel({
      userId: params.userId,
      name: params.name,
      birthDate: params.birthDate,
      phoneNumber: params.phoneNumber,
      address: params.address,
      status: 'ACTIVE',
    });
  }

  get userId(): string {
    return this.etc.userId;
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

  get status(): MemberStatus {
    return this.etc.status;
  }
}
