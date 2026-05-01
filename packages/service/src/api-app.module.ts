import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application';
import { resolveLogLevel, ServiceConfigModule } from '@infrastructure/config';
import { PresentationModule } from '@presentation';

@Module({
  imports: [
    ServiceConfigModule.forApi(),
    RvlogNestModule.forRoot({
      logger: {
        minLevel: resolveLogLevel(process.env.LOG_LEVEL),
        pretty: true,
      },
      http: {
        excludePaths: ['/health'],
      },
    }),
    ApplicationModule,
    PresentationModule,
  ],
})
export class ApiAppModule {}
