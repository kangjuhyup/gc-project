import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { persistenceEntities } from './entities';

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
  exports: [MikroOrmModule],
})
export class PersistenceModule {}
