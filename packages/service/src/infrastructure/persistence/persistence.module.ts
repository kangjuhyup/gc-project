import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import {
  MEMBER_QUERY,
} from '../../application/query/ports';
import {
  MEMBER_REPOSITORY,
  PHONE_VERIFICATION_REPOSITORY,
} from '../../application/commands/ports';
import { persistenceEntities } from './entities';
import {
  MikroOrmMemberRepository,
  MikroOrmPhoneVerificationRepository,
} from './repositories';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      entities: persistenceEntities,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      dbName: process.env.DB_NAME ?? 'gc_project',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      debug: process.env.NODE_ENV !== 'production',
    }),
  ],
  providers: [
    MikroOrmMemberRepository,
    MikroOrmPhoneVerificationRepository,
    {
      provide: MEMBER_REPOSITORY,
      useExisting: MikroOrmMemberRepository,
    },
    {
      provide: MEMBER_QUERY,
      useExisting: MikroOrmMemberRepository,
    },
    {
      provide: PHONE_VERIFICATION_REPOSITORY,
      useExisting: MikroOrmPhoneVerificationRepository,
    },
  ],
  exports: [
    MikroOrmModule,
    MEMBER_REPOSITORY,
    MEMBER_QUERY,
    PHONE_VERIFICATION_REPOSITORY,
  ],
})
export class PersistenceModule {}
