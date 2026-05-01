import { Module } from '@nestjs/common';
import {
  CheckUserIdAvailabilityQuery,
  GetMyReservationQuery,
  GetPaymentQuery,
  GetHealthQuery,
  ListAdminMembersQuery,
  ListAdminMoviesQuery,
  ListMoviesQuery,
  ListMyReservationsQuery,
  ListScreeningSeatsQuery,
  ListTheatersQuery,
  SearchAddressesQuery,
} from './dto';
import {
  ADDRESS_SEARCH,
  MEMBER_QUERY,
  MOVIE_QUERY,
  PAYMENT_QUERY,
  RESERVATION_QUERY,
  SEAT_QUERY,
  THEATER_QUERY,
  type AddressSearchPort,
  type MemberQueryPort,
  type MovieQueryPort,
  type PaymentQueryPort,
  type ReservationQueryPort,
  type SeatQueryPort,
  type TheaterQueryPort,
} from '@application/query/ports';
import { InfrastructureModule } from '@infrastructure';
import { QueryBus } from './query-bus';
import {
  CheckUserIdAvailabilityQueryHandler,
  GetPaymentQueryHandler,
  GetHealthQueryHandler,
  GetMyReservationQueryHandler,
  ListAdminMembersQueryHandler,
  ListAdminMoviesQueryHandler,
  ListMoviesQueryHandler,
  ListMyReservationsQueryHandler,
  ListScreeningSeatsQueryHandler,
  ListTheatersQueryHandler,
  SearchAddressesQueryHandler,
} from './handlers';

@Module({
  imports: [InfrastructureModule],
  providers: [
    GetHealthQueryHandler,
    {
      provide: CheckUserIdAvailabilityQueryHandler,
      useFactory: (memberQuery: MemberQueryPort) => new CheckUserIdAvailabilityQueryHandler(memberQuery),
      inject: [MEMBER_QUERY],
    },
    {
      provide: SearchAddressesQueryHandler,
      useFactory: (addressSearch: AddressSearchPort) => new SearchAddressesQueryHandler(addressSearch),
      inject: [ADDRESS_SEARCH],
    },
    {
      provide: ListAdminMembersQueryHandler,
      useFactory: (memberQuery: MemberQueryPort) => new ListAdminMembersQueryHandler(memberQuery),
      inject: [MEMBER_QUERY],
    },
    {
      provide: ListAdminMoviesQueryHandler,
      useFactory: (movieQuery: MovieQueryPort) => new ListAdminMoviesQueryHandler(movieQuery),
      inject: [MOVIE_QUERY],
    },
    {
      provide: ListMoviesQueryHandler,
      useFactory: (movieQuery: MovieQueryPort) => new ListMoviesQueryHandler(movieQuery),
      inject: [MOVIE_QUERY],
    },
    {
      provide: ListTheatersQueryHandler,
      useFactory: (theaterQuery: TheaterQueryPort) => new ListTheatersQueryHandler(theaterQuery),
      inject: [THEATER_QUERY],
    },
    {
      provide: ListScreeningSeatsQueryHandler,
      useFactory: (seatQuery: SeatQueryPort) => new ListScreeningSeatsQueryHandler(seatQuery),
      inject: [SEAT_QUERY],
    },
    {
      provide: GetPaymentQueryHandler,
      useFactory: (paymentQuery: PaymentQueryPort) => new GetPaymentQueryHandler(paymentQuery),
      inject: [PAYMENT_QUERY],
    },
    {
      provide: GetMyReservationQueryHandler,
      useFactory: (reservationQuery: ReservationQueryPort) => new GetMyReservationQueryHandler(reservationQuery),
      inject: [RESERVATION_QUERY],
    },
    {
      provide: ListMyReservationsQueryHandler,
      useFactory: (reservationQuery: ReservationQueryPort) => new ListMyReservationsQueryHandler(reservationQuery),
      inject: [RESERVATION_QUERY],
    },
    {
      provide: QueryBus,
      useFactory: (
        getHealthQueryHandler: GetHealthQueryHandler,
        checkUserIdAvailabilityQueryHandler: CheckUserIdAvailabilityQueryHandler,
        listAdminMembersQueryHandler: ListAdminMembersQueryHandler,
        searchAddressesQueryHandler: SearchAddressesQueryHandler,
        listMoviesQueryHandler: ListMoviesQueryHandler,
        listAdminMoviesQueryHandler: ListAdminMoviesQueryHandler,
        listTheatersQueryHandler: ListTheatersQueryHandler,
        listScreeningSeatsQueryHandler: ListScreeningSeatsQueryHandler,
        getPaymentQueryHandler: GetPaymentQueryHandler,
        getMyReservationQueryHandler: GetMyReservationQueryHandler,
        listMyReservationsQueryHandler: ListMyReservationsQueryHandler,
      ) =>
        QueryBus.of([
          { query: CheckUserIdAvailabilityQuery, handler: checkUserIdAvailabilityQueryHandler },
          { query: ListAdminMembersQuery, handler: listAdminMembersQueryHandler },
          { query: SearchAddressesQuery, handler: searchAddressesQueryHandler },
          { query: ListMoviesQuery, handler: listMoviesQueryHandler },
          { query: ListAdminMoviesQuery, handler: listAdminMoviesQueryHandler },
          { query: ListTheatersQuery, handler: listTheatersQueryHandler },
          { query: ListScreeningSeatsQuery, handler: listScreeningSeatsQueryHandler },
          { query: GetPaymentQuery, handler: getPaymentQueryHandler },
          { query: GetMyReservationQuery, handler: getMyReservationQueryHandler },
          { query: ListMyReservationsQuery, handler: listMyReservationsQueryHandler },
          { query: GetHealthQuery, handler: getHealthQueryHandler },
        ]),
      inject: [
        GetHealthQueryHandler,
        CheckUserIdAvailabilityQueryHandler,
        ListAdminMembersQueryHandler,
        SearchAddressesQueryHandler,
        ListMoviesQueryHandler,
        ListAdminMoviesQueryHandler,
        ListTheatersQueryHandler,
        ListScreeningSeatsQueryHandler,
        GetPaymentQueryHandler,
        GetMyReservationQueryHandler,
        ListMyReservationsQueryHandler,
      ],
    },
  ],
  exports: [QueryBus],
})
export class QueryModule {}
