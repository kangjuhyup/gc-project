import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApplicationModule } from '@application';
import { resolveLogLevel, ServiceConfigModule } from '@infrastructure/config';
import { buildThrottlerOptions } from '@infrastructure/config/throttler.config';
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
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildThrottlerOptions,
    }),
    ApplicationModule,
    PresentationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiAppModule {}
