import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import { ApplicationModule } from '@application';
import { PresentationModule } from '@presentation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
export class AppModule {}
