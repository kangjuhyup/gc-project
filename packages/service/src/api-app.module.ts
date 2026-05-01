import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application';
import { ServiceConfigModule } from '@infrastructure/config';
import { PresentationModule } from '@presentation';

@Module({
  imports: [
    ServiceConfigModule.forApi(),
    RvlogNestModule.forRoot({
      logger: {
        minLevel: LogLevel.INFO,
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
