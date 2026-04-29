import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application';
import { InfrastructureModule } from '@infrastructure';
import { MemberAuthGuard } from './guard';
import {
  AddressController,
  HealthController,
  MemberController,
  MovieController,
  PaymentController,
  SeatController,
  TheaterController,
} from './http';

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [
    HealthController,
    MemberController,
    AddressController,
    MovieController,
    PaymentController,
    TheaterController,
    SeatController,
  ],
  providers: [MemberAuthGuard],
})
export class PresentationModule {}
