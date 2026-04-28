export const queryKeys = {
  movies: {
    all: ['movies'] as const,
    list: (keyword = '') => [...queryKeys.movies.all, 'list', keyword] as const,
    detail: (movieId: number) => [...queryKeys.movies.all, 'detail', movieId] as const,
  },
  reservations: {
    all: ['reservations'] as const,
    list: (memberId: number) => [...queryKeys.reservations.all, 'list', memberId] as const,
    detail: (reservationId: number) =>
      [...queryKeys.reservations.all, 'detail', reservationId] as const,
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
