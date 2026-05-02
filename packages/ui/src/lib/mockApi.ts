import { demoMovies, filterMoviesForKeyword } from '@/features/movies/movieTimeline';
import type { PaymentResultDto, RequestPaymentRequestDto } from '@/features/payment/paymentApi';
import type {
  ReservationCanceledDto,
  ReservationListResponse,
  ReservationSummary,
} from '@/features/reservations/reservationApi';
import type { SeatSummary } from '@/features/seats/seatApi';
import type {
  AddressSearchResponse,
  IdAvailabilityResponse,
  PhoneVerificationConfirmResponse,
  PhoneVerificationRequestResponse,
} from '@/features/signup/signupApi';
import { shouldUseMockApi } from './apiMode';

interface MockRequest {
  body?: BodyInit | null;
  method: string;
  path: string;
}

interface MockResponse<TResponse> {
  data: TResponse;
  status?: number;
}

const mockMembers = new Set(['admin', 'movie_user', 'tester']);
const mockVerificationCode = '123456';
const mockHeldSeatIdsByScreening = new Map<string, Set<string>>();
const mockSeatHoldIndex = new Map<string, { screeningId: string; seatId: string }>();
const mockPayments = new Map<string, PaymentResultDto & { approvedAt: number }>();
let mockNextSeatHoldId = 9001;
const mockReservations: ReservationSummary[] = [
  {
    id: '1',
    reservationNumber: 'R20260428101',
    status: 'CONFIRMED',
    totalPrice: 28000,
    createdAt: '2026-04-28T09:12:00+09:00',
    movieTitle: '파묘',
    posterUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=560&q=80',
    screeningStartAt: '2026-04-28T18:20:00+09:00',
    screenName: '2관',
    seats: ['C4', 'C5'],
  },
  {
    id: '2',
    reservationNumber: 'R20260420401',
    status: 'CONFIRMED',
    totalPrice: 14000,
    createdAt: '2026-04-20T14:40:00+09:00',
    movieTitle: '괴물',
    posterUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=560&q=80',
    screeningStartAt: '2026-04-21T19:00:00+09:00',
    screenName: '아트관',
    seats: ['E6'],
  },
  {
    id: '3',
    reservationNumber: 'R20260411201',
    status: 'CANCELED',
    totalPrice: 36000,
    createdAt: '2026-04-11T11:30:00+09:00',
    movieTitle: '듄: 파트 2',
    posterUrl:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=560&q=80',
    screeningStartAt: '2026-04-12T20:40:00+09:00',
    screenName: 'IMAX',
    seats: ['F8', 'F9'],
    canceledAt: '2026-04-11T15:20:00+09:00',
    cancelReason: '사용자 요청으로 취소되었습니다.',
  },
];

export async function resolveMockApi({
  body,
  method,
  path,
}: MockRequest): Promise<MockResponse<unknown> | null> {
  if (!shouldMockApi()) {
    return null;
  }

  const url = new URL(path, 'http://mock.local');
  const pathname = url.pathname;

  await waitForMockLatency();

  if (method === 'POST' && pathname === '/members/login') {
    const payload = await readJsonBody<{ userId?: string; password?: string }>(body);
    const userId = payload.userId?.trim() || 'movie_user';

    return toMockResponse({
      memberId: '1',
      userId,
      accessToken: `member:1:${crypto.randomUUID()}`,
      accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      refreshToken: crypto.randomUUID(),
      refreshTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  if (method === 'POST' && pathname === '/members/logout') {
    return toMockResponse({
      memberId: '1',
      loggedOut: true,
      revokedRefreshTokenCount: 1,
    });
  }

  if (method === 'GET' && pathname === '/members/check-user-id') {
    const userId = url.searchParams.get('userId')?.trim().toLocaleLowerCase() ?? '';

    return toMockResponse<IdAvailabilityResponse>({
      available: Boolean(userId) && !mockMembers.has(userId),
    });
  }

  if (method === 'POST' && pathname === '/phone-verifications') {
    return toMockResponse<PhoneVerificationRequestResponse>({
      verificationId: 'mock-verification-1',
      code: mockVerificationCode,
      expiresAt: new Date(Date.now() + 180 * 1000).toISOString(),
    });
  }

  if (method === 'POST' && pathname === '/phone-verifications/confirm') {
    const payload = await readJsonBody<{ code?: string; verificationId?: string }>(body);

    return toMockResponse<PhoneVerificationConfirmResponse>({
      verified: Boolean(payload.verificationId) && payload.code === mockVerificationCode,
    });
  }

  if (method === 'POST' && pathname === '/members/signup') {
    const payload = await readJsonBody<{ userId?: string }>(body);

    return toMockResponse({
      memberId: '2',
      userId: payload.userId ?? 'mock_member',
    });
  }

  if (method === 'POST' && pathname === '/members/password') {
    const payload = await readJsonBody<{ userId?: string }>(body);

    return toMockResponse({
      userId: payload.userId ?? 'movie_user',
      changed: true,
    });
  }

  if (method === 'DELETE' && pathname === '/members/me') {
    return toMockResponse({
      memberId: '1',
      userId: 'movie_user',
      withdrawn: true,
    });
  }

  if (method === 'POST' && pathname === '/payments') {
    const payload = await readJsonBody<RequestPaymentRequestDto>(body);
    const heldSeats = payload.seatHoldIds
      .map((seatHoldId) => mockSeatHoldIndex.get(seatHoldId))
      .filter((heldSeat) => heldSeat !== undefined);
    const screeningId = Number(heldSeats[0]?.screeningId ?? '101');
    const reservationNumber = `R${new Date().getFullYear()}${String(screeningId).padStart(4, '0')}${String(
      Math.floor(Math.random() * 1000),
    ).padStart(3, '0')}`;
    const paymentScreening = findMockScreening(screeningId);
    const reservationId = String(Date.now());

    mockReservations.unshift({
      id: reservationId,
      reservationNumber,
      status: 'CONFIRMED',
      totalPrice: payload.amount,
      createdAt: new Date().toISOString(),
      movieTitle: paymentScreening?.movie.title ?? '영화',
      posterUrl: paymentScreening?.movie.posterUrl ?? '',
      screeningStartAt: paymentScreening?.screening.startAt ?? new Date().toISOString(),
      screenName: paymentScreening?.screening.screenName ?? '상영관',
      seats: heldSeats.map((heldSeat) => getMockSeatLabel(screeningId, heldSeat.seatId)),
    });

    const paymentId = String(Date.now());
    const paymentResult: PaymentResultDto & { approvedAt: number } = {
      paymentId,
      seatHoldId: payload.seatHoldIds[0] ?? 'mock-seat-hold',
      seatHoldIds: payload.seatHoldIds,
      idempotencyKey: payload.idempotencyKey,
      reservationId,
      provider: payload.provider,
      providerPaymentId: `mock-${paymentId}`,
      status: 'PENDING',
      amount: payload.amount,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      approvedAt: Date.now() + 5_000,
    };

    mockPayments.set(paymentId, paymentResult);

    return toMockResponse<PaymentResultDto>(paymentResult);
  }

  const paymentDetailMatch = pathname.match(/^\/payments\/(\d+)$/);

  if (method === 'GET' && paymentDetailMatch) {
    const paymentId = paymentDetailMatch[1];
    const payment = mockPayments.get(paymentId);

    if (payment && Date.now() >= payment.approvedAt) {
      payment.status = 'APPROVED';
    }

    return toMockResponse<PaymentResultDto>(
      payment ?? {
        paymentId,
        seatHoldId: 'mock-seat-hold',
        seatHoldIds: ['mock-seat-hold'],
        idempotencyKey: `mock-${paymentId}`,
        reservationId: `reservation-${paymentId}`,
        provider: 'LOCAL',
        providerPaymentId: `mock-${paymentId}`,
        status: 'APPROVED',
        amount: 15000,
      },
    );
  }

  if (method === 'GET' && pathname === '/reservations') {
    const limit = Number(url.searchParams.get('limit') ?? '20');

    return toMockResponse<ReservationListResponse>({
      items: mockReservations.slice(0, limit),
      hasNext: false,
    });
  }

  const reservationDetailMatch = pathname.match(/^\/reservations\/(.+)$/);

  if (method === 'GET' && reservationDetailMatch) {
    const reservationId = decodeURIComponent(reservationDetailMatch[1]);
    const reservation = mockReservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return {
        data: { message: 'RESERVATION_NOT_FOUND' },
        status: 404,
      };
    }

    return toMockResponse({
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      status: reservation.status,
      totalPrice: reservation.totalPrice,
      paymentAmount: reservation.totalPrice,
      createdAt: reservation.createdAt,
      canceledAt: reservation.canceledAt,
      cancelReason: reservation.cancelReason,
      movie: {
        id: reservation.id,
        title: reservation.movieTitle,
        posterUrl: reservation.posterUrl,
      },
      screening: {
        id: reservation.id,
        screenName: reservation.screenName,
        startAt: reservation.screeningStartAt,
        endAt: reservation.screeningStartAt,
        theater: {
          id: '1',
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
        },
      },
      seats: reservation.seats.map((seat, index) => ({
        id: `${reservation.id}-${index}`,
        row: seat.slice(0, 1),
        col: Number(seat.slice(1)),
        type: 'NORMAL',
      })),
      payment: {
        id: `payment-${reservation.id}`,
        status: 'APPROVED',
        amount: reservation.totalPrice,
      },
    });
  }

  const reservationCancelMatch = pathname.match(/^\/reservations\/(\d+)\/cancel$/);

  if (method === 'POST' && reservationCancelMatch) {
    const reservationId = reservationCancelMatch[1];
    const payload = await readJsonBody<{ reason?: string }>(body);
    const reservation = mockReservations.find((item) => item.id === reservationId);

    if (reservation) {
      reservation.status = 'CANCELED';
      reservation.canceledAt = new Date().toISOString();
      reservation.cancelReason = payload.reason ?? '사용자 요청';
    }

    return toMockResponse<ReservationCanceledDto>({
      reservationId,
      paymentId: `payment-${reservationId}`,
      reservationStatus: 'CANCELED',
      paymentStatus: 'REFUND_REQUIRED',
      reason: payload.reason,
    });
  }

  if (method === 'POST' && pathname === '/seat-holds') {
    const payload = await readJsonBody<{ screeningId?: string; seatIds?: string[] }>(body);
    const screeningId = payload.screeningId ?? '';
    const seatIds = payload.seatIds ?? [];
    const heldSeatIds = mockHeldSeatIdsByScreening.get(screeningId) ?? new Set<string>();
    const holdIds = seatIds.map((seatId) => {
      const holdId = String(mockNextSeatHoldId);

      mockNextSeatHoldId += 1;
      mockSeatHoldIndex.set(holdId, { screeningId, seatId });

      return holdId;
    });

    seatIds.forEach((seatId) => heldSeatIds.add(seatId));
    mockHeldSeatIdsByScreening.set(screeningId, heldSeatIds);

    return toMockResponse({
      screeningId,
      seatIds,
      holdIds,
      ttlSeconds: 600,
      expiresAt: new Date(Date.now() + 600 * 1000).toISOString(),
    });
  }

  const seatHoldReleaseMatch = pathname.match(/^\/seat-holds\/(.+)$/);

  if (method === 'DELETE' && seatHoldReleaseMatch) {
    const holdId = decodeURIComponent(seatHoldReleaseMatch[1]);
    const heldSeat = mockSeatHoldIndex.get(holdId);

    if (heldSeat) {
      const heldSeatIds = mockHeldSeatIdsByScreening.get(heldSeat.screeningId);

      heldSeatIds?.delete(heldSeat.seatId);
      mockSeatHoldIndex.delete(holdId);
    }

    return toMockResponse({
      holdId,
      released: true,
    });
  }

  if (method === 'GET' && pathname === '/api/addresses') {
    const keyword = url.searchParams.get('keyword') ?? '';
    const items = mockAddresses.filter((address) =>
      [address.roadAddress, address.jibunAddress, address.buildingName]
        .join(' ')
        .toLocaleLowerCase()
        .includes(keyword.trim().toLocaleLowerCase()),
    );

    return toMockResponse<AddressSearchResponse>({
      totalCount: items.length,
      currentPage: 1,
      countPerPage: 10,
      items: items.slice(0, 10),
    });
  }

  if (method === 'GET' && pathname === '/movies') {
    const keyword = url.searchParams.get('keyword') ?? '';

    return toMockResponse({
      items: filterMoviesForKeyword(demoMovies, keyword).map(({ screenings: _screenings, ...movie }) => movie),
      hasNext: false,
    });
  }

  const movieScheduleMatch = pathname.match(/^\/movies\/(\d+)\/schedules$/);

  if (method === 'GET' && movieScheduleMatch) {
    const movieId = Number(movieScheduleMatch[1]);
    const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
    const movie = demoMovies.find((currentMovie) => currentMovie.id === movieId);

    if (!movie) {
      return null;
    }

    const theaters = new Map<number, {
      theater: { id: number; name: string; address: string };
      screenings: NonNullable<typeof movie.screenings>;
    }>();

    (movie.screenings ?? [])
      .filter((screening) => screening.startAt.slice(0, 10) === date)
      .forEach((screening) => {
        const group = theaters.get(screening.theater.id) ?? {
          theater: screening.theater,
          screenings: [],
        };

        group.screenings.push(screening);
        theaters.set(screening.theater.id, group);
      });

    return toMockResponse({
      movie: {
        id: movie.id,
        title: movie.title,
        genre: movie.genre,
        rating: movie.rating,
        runningTime: movie.runningTime,
        posterUrl: movie.posterUrl,
      },
      date,
      theaters: [...theaters.values()],
    });
  }

  if (method === 'GET' && pathname === '/theaters') {
    const theaters = new Map<number, { id: number; name: string; address: string }>();

    demoMovies
      .flatMap((movie) => movie.screenings ?? [])
      .forEach((screening) => {
        theaters.set(screening.theater.id, screening.theater);
      });

    return toMockResponse({
      items: [...theaters.values()],
    });
  }

  const theaterScheduleMatch = pathname.match(/^\/theaters\/(\d+)\/schedules$/);

  if (method === 'GET' && theaterScheduleMatch) {
    const theaterId = Number(theaterScheduleMatch[1]);
    const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
    const theater = demoMovies
      .flatMap((movie) => movie.screenings ?? [])
      .find((screening) => screening.theater.id === theaterId)?.theater;

    if (!theater) {
      return null;
    }

    return toMockResponse({
      theater,
      date,
      movies: demoMovies
        .map((movie) => ({
          id: movie.id,
          title: movie.title,
          genre: movie.genre,
          rating: movie.rating,
          runningTime: movie.runningTime,
          posterUrl: movie.posterUrl,
          screenings: (movie.screenings ?? []).filter(
            (screening) =>
              screening.theater.id === theaterId && screening.startAt.slice(0, 10) === date,
          ),
        }))
        .filter((movie) => movie.screenings.length > 0),
    });
  }

  const screeningSeatsMatch = pathname.match(/^\/screenings\/(\d+)\/seats$/);

  if (method === 'GET' && screeningSeatsMatch) {
    const screeningId = Number(screeningSeatsMatch[1]);
    const movie = demoMovies.find((currentMovie) =>
      (currentMovie.screenings ?? []).some((screening) => screening.id === screeningId),
    );
    const screening = movie?.screenings?.find((currentScreening) => currentScreening.id === screeningId);

    if (!movie || !screening) {
      return null;
    }

    return toMockResponse({
      screeningId: String(screening.id),
      seats: createMockSeats(screening.id),
    });
  }

  return null;
}

function shouldMockApi() {
  return shouldUseMockApi();
}

async function readJsonBody<TBody>(body: BodyInit | null | undefined) {
  if (!body || typeof body !== 'string') {
    return {} as TBody;
  }

  try {
    return JSON.parse(body) as TBody;
  } catch {
    return {} as TBody;
  }
}

function toMockResponse<TResponse>(data: TResponse): MockResponse<TResponse> {
  return {
    data,
    status: 200,
  };
}

function waitForMockLatency() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 160);
  });
}

const mockAddresses: AddressSearchResponse['items'] = [
  {
    roadAddress: '서울특별시 강남구 테헤란로 427',
    roadAddressPart1: '서울특별시 강남구 테헤란로 427',
    roadAddressPart2: '',
    jibunAddress: '서울특별시 강남구 삼성동 143-48',
    englishAddress: '427, Teheran-ro, Gangnam-gu, Seoul',
    zipCode: '06159',
    administrativeCode: '1168010500',
    roadNameCode: '116803122010',
    buildingManagementNumber: '1168010500101430048000001',
    buildingName: '위워크타워',
    city: '서울특별시',
    district: '강남구',
    town: '삼성동',
  },
  {
    roadAddress: '서울특별시 송파구 올림픽로 300',
    roadAddressPart1: '서울특별시 송파구 올림픽로 300',
    roadAddressPart2: '',
    jibunAddress: '서울특별시 송파구 신천동 29',
    englishAddress: '300, Olympic-ro, Songpa-gu, Seoul',
    zipCode: '05551',
    administrativeCode: '1171010100',
    roadNameCode: '117103123001',
    buildingManagementNumber: '1171010100100290000000001',
    buildingName: '롯데월드타워',
    city: '서울특별시',
    district: '송파구',
    town: '신천동',
  },
  {
    roadAddress: '부산광역시 해운대구 센텀남대로 35',
    roadAddressPart1: '부산광역시 해운대구 센텀남대로 35',
    roadAddressPart2: '',
    jibunAddress: '부산광역시 해운대구 우동 1495',
    englishAddress: '35, Centumnam-daero, Haeundae-gu, Busan',
    zipCode: '48058',
    administrativeCode: '2635010500',
    roadNameCode: '263503133001',
    buildingManagementNumber: '2635010500114950000000001',
    buildingName: '신세계백화점 센텀시티점',
    city: '부산광역시',
    district: '해운대구',
    town: '우동',
  },
];

function createMockSeats(screeningId: number): SeatSummary[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const heldSeatIds = mockHeldSeatIdsByScreening.get(String(screeningId)) ?? new Set<string>();

  return rows.flatMap((row, rowIndex) =>
    Array.from({ length: 10 }, (_, colIndex) => {
      const col = colIndex + 1;
      const seatNumber = rowIndex * 10 + col;

      return {
        id: String(screeningId * 1000 + seatNumber),
        label: `${row}${col}`,
        row,
        col,
        type: row === 'H' && col >= 9 ? 'COUPLE' : col === 1 ? 'DISABLED' : 'NORMAL',
        status: heldSeatIds.has(String(screeningId * 1000 + seatNumber))
          ? 'HELD'
          : getMockSeatStatus(screeningId, seatNumber),
      };
    }),
  );
}

function getMockSeatStatus(screeningId: number, seatNumber: number): SeatSummary['status'] {
  if ((screeningId + seatNumber) % 11 === 0) {
    return 'RESERVED';
  }

  if ((screeningId + seatNumber) % 7 === 0) {
    return 'HELD';
  }

  return 'AVAILABLE';
}

function findMockScreening(screeningId: number) {
  for (const movie of demoMovies) {
    const screening = movie.screenings?.find((currentScreening) => currentScreening.id === screeningId);

    if (screening) {
      return {
        movie,
        screening,
      };
    }
  }

  return null;
}

function getMockSeatLabel(screeningId: number, seatId: string) {
  const seatNumber = Number(seatId) - screeningId * 1000;
  const rowIndex = Math.floor((seatNumber - 1) / 10);
  const col = ((seatNumber - 1) % 10) + 1;
  const row = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][rowIndex] ?? 'A';

  return `${row}${col}`;
}
