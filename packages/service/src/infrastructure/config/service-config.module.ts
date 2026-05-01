import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  apiValidationSchema,
  serviceValidationOptions,
  workerValidationSchema,
} from './service-config';

@Module({})
export class ServiceConfigModule {
  static forApi(): DynamicModule | Promise<DynamicModule> {
    return ConfigModule.forRoot({
      isGlobal: true,
      validationOptions: serviceValidationOptions,
      validationSchema: apiValidationSchema,
    });
  }

  static forWorker(): DynamicModule | Promise<DynamicModule> {
    return ConfigModule.forRoot({
      envFilePath: '.env.worker',
      isGlobal: true,
      validationOptions: serviceValidationOptions,
      validationSchema: workerValidationSchema,
    });
  }
}
