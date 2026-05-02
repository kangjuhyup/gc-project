export const queryKeys = {
  movies: {
    all: ['movies'] as const,
    list: (keyword = '') => [...queryKeys.movies.all, 'list', keyword] as const,
    detail: (movieId: number) => [...queryKeys.movies.all, 'detail', movieId] as const,
    schedules: (movieId: number, date: string) =>
      [...queryKeys.movies.all, 'schedules', movieId, date] as const,
  },
  theaters: {
    all: ['theaters'] as const,
    list: () => [...queryKeys.theaters.all, 'list'] as const,
    schedules: (theaterId: number, date: string) =>
      [...queryKeys.theaters.all, 'schedules', theaterId, date] as const,
  },
  reservations: {
    all: ['reservations'] as const,
    list: () => [...queryKeys.reservations.all, 'list'] as const,
    detail: (reservationId: string) =>
      [...queryKeys.reservations.all, 'detail', reservationId] as const,
  },
  payments: {
    all: ['payments'] as const,
    detail: (paymentId: string) => [...queryKeys.payments.all, 'detail', paymentId] as const,
  },
  screenings: {
    all: ['screenings'] as const,
    seats: (screeningId: number) => [...queryKeys.screenings.all, screeningId, 'seats'] as const,
  },
  members: {
    all: ['members'] as const,
    idAvailability: (memberId: string) =>
      [...queryKeys.members.all, 'id-availability', memberId] as const,
  },
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  addresses: {
    all: ['addresses'] as const,
    search: (keyword: string) => [...queryKeys.addresses.all, 'search', keyword] as const,
  },
};
