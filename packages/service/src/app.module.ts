import { Module } from '@nestjs/common';
import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import { GetHealthQueryHandler } from './application/query/handlers/get-health.query-handler';
import { PersistenceModule } from './infrastructure/persistence';
import { HealthController } from './presentation/http/health.controller';

@Module({
  imports: [
    PersistenceModule,
    RvlogNestModule.forRoot({
      logger: {
        minLevel: LogLevel.INFO,
        pretty: true,
      },
      http: {
        excludePaths: ['/health'],
      },
    }),
  ],
  controllers: [HealthController],
  providers: [GetHealthQueryHandler],
})
export class AppModule {}
