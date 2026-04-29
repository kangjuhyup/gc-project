import { Entity, ManyToOne, PrimaryKey, Property, Rel, Unique } from '@mikro-orm/core';
import { MemberEntity } from './member.entity';

@Entity({ tableName: 'member_refresh_token' })
@Unique({ name: 'uq_member_refresh_token_token', properties: ['token'] })
export class RefreshTokenEntity {
  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @ManyToOne(() => MemberEntity)
  member!: Rel<MemberEntity>;

  @Property({ length: 100 })
  token!: string;

  @Property({ columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
