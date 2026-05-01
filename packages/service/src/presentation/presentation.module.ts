import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application';
import { InfrastructureModule } from '@infrastructure';
import { AdminAuthGuard, MemberAuthGuard } from './guard';
import { AdminPiiMaskInterceptor } from './interceptor';
import {
  AdminController,
  AddressController,
  HealthController,
  MemberController,
  MovieController,
  PaymentController,
  ReservationController,
  SeatController,
  TheaterController,
} from './http';

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [
    HealthController,
    AdminController,
    MemberController,
    AddressController,
    MovieController,
    PaymentController,
    ReservationController,
    TheaterController,
    SeatController,
  ],
  providers: [AdminAuthGuard, AdminPiiMaskInterceptor, MemberAuthGuard],
})
export class PresentationModule {}
