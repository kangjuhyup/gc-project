import { Module } from '@nestjs/common';
import {
  CheckUserIdAvailabilityQuery,
  GetPaymentQuery,
  GetHealthQuery,
  ListMoviesQuery,
  ListScreeningSeatsQuery,
  ListTheatersQuery,
  QueryBus,
  SearchAddressesQuery,
} from '@application';
import {
  ADDRESS_SEARCH,
  MEMBER_QUERY,
  MOVIE_QUERY,
  PAYMENT_QUERY,
  SEAT_QUERY,
  THEATER_QUERY,
  type AddressSearchPort,
  type MemberQueryPort,
  type MovieQueryPort,
  type PaymentQueryPort,
  type SeatQueryPort,
  type TheaterQueryPort,
} from '@application/query/ports';
import { InfrastructureModule } from '@infrastructure';
import {
  CheckUserIdAvailabilityQueryHandler,
  GetPaymentQueryHandler,
  GetHealthQueryHandler,
  ListMoviesQueryHandler,
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
      provide: QueryBus,
      useFactory: (
        getHealthQueryHandler: GetHealthQueryHandler,
        checkUserIdAvailabilityQueryHandler: CheckUserIdAvailabilityQueryHandler,
        searchAddressesQueryHandler: SearchAddressesQueryHandler,
        listMoviesQueryHandler: ListMoviesQueryHandler,
        listTheatersQueryHandler: ListTheatersQueryHandler,
        listScreeningSeatsQueryHandler: ListScreeningSeatsQueryHandler,
        getPaymentQueryHandler: GetPaymentQueryHandler,
      ) =>
        QueryBus.of([
          { query: CheckUserIdAvailabilityQuery, handler: checkUserIdAvailabilityQueryHandler },
          { query: SearchAddressesQuery, handler: searchAddressesQueryHandler },
          { query: ListMoviesQuery, handler: listMoviesQueryHandler },
          { query: ListTheatersQuery, handler: listTheatersQueryHandler },
          { query: ListScreeningSeatsQuery, handler: listScreeningSeatsQueryHandler },
          { query: GetPaymentQuery, handler: getPaymentQueryHandler },
          { query: GetHealthQuery, handler: getHealthQueryHandler },
        ]),
      inject: [
        GetHealthQueryHandler,
        CheckUserIdAvailabilityQueryHandler,
        SearchAddressesQueryHandler,
        ListMoviesQueryHandler,
        ListTheatersQueryHandler,
        ListScreeningSeatsQueryHandler,
        GetPaymentQueryHandler,
      ],
    },
  ],
  exports: [QueryBus],
})
export class QueryModule {}
