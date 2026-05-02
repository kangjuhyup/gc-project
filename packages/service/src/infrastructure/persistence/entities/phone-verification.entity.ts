import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { EncryptedProperty } from '../encryption';

@Entity({ tableName: 'phone_verification' })
@Index({ name: 'idx_phone_verification_phone_status', properties: ['phoneNumber', 'status'] })
export class PhoneVerificationEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @EncryptedProperty()
  @Property({ length: 255 })
  phoneNumber!: string;

  @Property({ length: 6 })
  code!: string;

  @Property({ length: 20 })
  status!: string;

  @Property({ columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
