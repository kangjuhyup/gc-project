import { demoMovies, filterMoviesForKeyword } from '@/features/movies/movieTimeline';
import type { LoginResponse } from '@/features/login/loginApi';
import type { PaymentRequest, PaymentResponse } from '@/features/payment/paymentApi';
import type { ReservationListResponse, ReservationSummary } from '@/features/reservations/reservationApi';
import type { ScreeningSeatMapResponse, SeatSummary } from '@/features/seats/seatApi';
import type {
  AddressSearchResponse,
  IdAvailabilityResponse,
  PhoneVerificationConfirmResponse,
  PhoneVerificationRequestResponse,
} from '@/features/signup/signupApi';

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
const mockReservations: ReservationSummary[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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

  if (method === 'POST' && pathname === '/auth/login') {
    const payload = await readJsonBody<{ memberId?: string; password?: string }>(body);
    const memberId = payload.memberId?.trim() || 'movie_user';

    return toMockResponse<LoginResponse>({
      accessToken: `mock-access-token-${memberId}`,
      member: {
        id: 1,
        memberId,
        name: '홍길동',
        nickname: '시네필',
      },
    });
  }

  if (method === 'POST' && pathname === '/members/check-id') {
    const payload = await readJsonBody<{ memberId?: string }>(body);
    const memberId = payload.memberId?.trim().toLocaleLowerCase() ?? '';

    return toMockResponse<IdAvailabilityResponse>({
      available: Boolean(memberId) && !mockMembers.has(memberId),
    });
  }

  if (method === 'POST' && pathname === '/members/phone-verifications') {
    return toMockResponse<PhoneVerificationRequestResponse>({
      expiresInSeconds: 180,
    });
  }

  if (method === 'POST' && pathname === '/members/phone-verifications/confirm') {
    const payload = await readJsonBody<{ verificationCode?: string }>(body);

    return toMockResponse<PhoneVerificationConfirmResponse>({
      verified: payload.verificationCode === mockVerificationCode,
      verificationToken: `mock-phone-token-${Date.now()}`,
    });
  }

  if (method === 'POST' && pathname === '/members') {
    const payload = await readJsonBody<{ memberId?: string }>(body);

    return toMockResponse({
      memberId: payload.memberId ?? 'mock_member',
    });
  }

  if (method === 'PATCH' && pathname === '/members/password') {
    return toMockResponse({
      changed: true,
    });
  }

  if (method === 'POST' && pathname === '/reservations') {
    const payload = await readJsonBody<PaymentRequest>(body);
    const reservationNumber = `R${new Date().getFullYear()}${String(payload.screeningId).padStart(
      4,
      '0',
    )}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const paymentScreening = findMockScreening(payload.screeningId);

    mockReservations.unshift({
      id: Date.now(),
      reservationNumber,
      status: 'CONFIRMED',
      totalPrice: payload.totalPrice,
      createdAt: new Date().toISOString(),
      movieTitle: paymentScreening?.movie.title ?? '영화',
      posterUrl: paymentScreening?.movie.posterUrl ?? '',
      screeningStartAt: paymentScreening?.screening.startAt ?? new Date().toISOString(),
      screenName: paymentScreening?.screening.screenName ?? '상영관',
      seats: payload.seatIds.map((seatId) => getMockSeatLabel(payload.screeningId, seatId)),
    });

    return toMockResponse<PaymentResponse>({
      reservationNumber,
      status: 'CONFIRMED',
      paidAt: new Date().toISOString(),
    });
  }

  if (method === 'GET' && pathname === '/reservations') {
    return toMockResponse<ReservationListResponse>({
      items: mockReservations,
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
      items: filterMoviesForKeyword(demoMovies, keyword),
    });
  }

  const screeningSeatsMatch = pathname.match(/^\/screenings\/(\d+)\/seats$/);

  if (method === 'GET' && screeningSeatsMatch) {
    const screeningId = Number(screeningSeatsMatch[1]);
    const movie = demoMovies.find((currentMovie) =>
      currentMovie.screenings.some((screening) => screening.id === screeningId),
    );
    const screening = movie?.screenings.find((currentScreening) => currentScreening.id === screeningId);

    if (!movie || !screening) {
      return null;
    }

    return toMockResponse<ScreeningSeatMapResponse>({
      screening: {
        id: screening.id,
        movieTitle: movie.title,
        screenName: screening.screenName,
        startAt: screening.startAt,
        endAt: screening.endAt,
        price: screening.screenName === 'IMAX' ? 18000 : 14000,
      },
      seats: createMockSeats(screening.id),
    });
  }

  return null;
}

function shouldMockApi() {
  return (
    import.meta.env.DEV &&
    import.meta.env.MODE === 'development' &&
    import.meta.env.VITE_API_MOCK !== 'false'
  );
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

  return rows.flatMap((row, rowIndex) =>
    Array.from({ length: 10 }, (_, colIndex) => {
      const col = colIndex + 1;
      const seatNumber = rowIndex * 10 + col;

      return {
        id: screeningId * 1000 + seatNumber,
        label: `${row}${col}`,
        row,
        col,
        type: row === 'H' && col >= 9 ? 'COUPLE' : col === 1 ? 'DISABLED' : 'NORMAL',
        status: getMockSeatStatus(screeningId, seatNumber),
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
    const screening = movie.screenings.find((currentScreening) => currentScreening.id === screeningId);

    if (screening) {
      return {
        movie,
        screening,
      };
    }
  }

  return null;
}

function getMockSeatLabel(screeningId: number, seatId: number) {
  const seatNumber = seatId - screeningId * 1000;
  const rowIndex = Math.floor((seatNumber - 1) / 10);
  const col = ((seatNumber - 1) % 10) + 1;
  const row = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][rowIndex] ?? 'A';

  return `${row}${col}`;
}
