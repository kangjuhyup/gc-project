import { describe, expect, it, vi } from 'vitest';
import { GetMyReservationQuery, ListMyReservationsQuery } from '@application';
import { MikroOrmReservationQueryRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmReservationQueryRepository', () => {
  it('내 예매 상세를 예매번호, 영화, 상영시간, 좌석, 결제금액, 상태로 매핑한다', async () => {
    const reservation = reservationRow({ id: '5001' });
    const entityManager = {
      findOne: vi.fn()
        .mockResolvedValueOnce(reservation)
        .mockResolvedValueOnce(paymentRow({ reservation })),
      find: vi.fn(),
    };
    const repository = new MikroOrmReservationQueryRepository(entityManager as never);

    const result = await repository.getMyReservation(
      GetMyReservationQuery.of({ memberId: '1', reservationId: '5001' }),
    );

    expect(entityManager.findOne).toHaveBeenNthCalledWith(1, expect.any(Function), {
      id: '5001',
      member: '1',
    }, {
      populate: [
        'screening.movie.images',
        'screening.screen.theater',
        'reservationSeats.seat',
      ],
    });
    expect(entityManager.findOne).toHaveBeenNthCalledWith(2, expect.any(Function), {
      member: '1',
      reservation: '5001',
    }, { orderBy: { createdAt: 'DESC', id: 'DESC' } });
    expect(result).toMatchObject({
      id: '5001',
      reservationNumber: 'R00000000000005003',
      status: 'CONFIRMED',
      totalPrice: 15000,
      paymentAmount: 15000,
      movie: {
        id: '1',
        title: '파묘',
      },
      screening: {
        id: '101',
        screenName: '1관',
        startAt: '2026-04-30T11:00:00.000Z',
        endAt: '2026-04-30T13:00:00.000Z',
      },
      seats: [
        {
          id: '1001',
          row: 'A',
          col: 1,
        },
      ],
      payment: {
        id: '7001',
        status: 'APPROVED',
        amount: 15000,
      },
    });
  });

  it('내 예매 상세가 없으면 undefined를 반환한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValueOnce(null),
    };
    const repository = new MikroOrmReservationQueryRepository(entityManager as never);

    const result = await repository.getMyReservation(
      GetMyReservationQuery.of({ memberId: '1', reservationId: '5001' }),
    );

    expect(result).toBeUndefined();
    expect(entityManager.findOne).toHaveBeenCalledTimes(1);
  });

  it('내 예매 목록을 최신순 커서 페이지네이션 응답으로 매핑한다', async () => {
    const reservations = [
      reservationRow({ id: '5003', createdAt: new Date('2026-04-30T10:03:00.000Z') }),
      reservationRow({ id: '5002', createdAt: new Date('2026-04-30T10:02:00.000Z') }),
      reservationRow({ id: '5001', createdAt: new Date('2026-04-30T10:01:00.000Z') }),
    ];
    const entityManager = {
      find: vi.fn()
        .mockResolvedValueOnce(reservations)
        .mockResolvedValueOnce([paymentRow({ reservation: reservations[0] })]),
    };
    const repository = new MikroOrmReservationQueryRepository(entityManager as never);

    const result = await repository.listMyReservations(ListMyReservationsQuery.of({ memberId: '1', limit: 2 }));

    expect(entityManager.find).toHaveBeenNthCalledWith(1, expect.any(Function), { member: '1' }, {
      populate: [
        'screening.movie.images',
        'screening.screen.theater',
        'reservationSeats.seat',
      ],
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit: 3,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: '5003',
      reservationNumber: 'R00000000000005003',
      status: 'CONFIRMED',
      totalPrice: 15000,
      movie: {
        id: '1',
        title: '파묘',
      },
      screening: {
        id: '101',
        theater: {
          id: '1',
          name: 'GC 시네마 강남',
        },
      },
      seats: [
        {
          id: '1001',
          row: 'A',
          col: 1,
          type: 'NORMAL',
        },
      ],
      payment: {
        id: '7001',
        status: 'APPROVED',
        amount: 15000,
        providerPaymentId: 'local-payment-7001',
      },
    });
    expect(result.hasNext).toBe(true);
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('커서가 있으면 다음 페이지 조건을 SQL 파라미터에 포함한다', async () => {
    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: '2026-04-30T10:02:00.000Z',
        reservationId: 5002,
      }),
      'utf8',
    ).toString('base64url');
    const entityManager = {
      find: vi.fn().mockResolvedValue([]),
    };
    const repository = new MikroOrmReservationQueryRepository(entityManager as never);

    await repository.listMyReservations(ListMyReservationsQuery.of({ memberId: '1', limit: 10, cursor }));

    expect(entityManager.find).toHaveBeenCalledWith(expect.any(Function), {
      member: '1',
      $or: [
        { createdAt: { $lt: new Date('2026-04-30T10:02:00.000Z') } },
        { createdAt: new Date('2026-04-30T10:02:00.000Z'), id: { $lt: '5002' } },
      ],
    }, expect.objectContaining({ limit: 11 }));
  });

  it('잘못된 커서가 들어오면 예매 커서 오류를 던진다', async () => {
    const repository = new MikroOrmReservationQueryRepository({ find: vi.fn() } as never);

    await expect(
      repository.listMyReservations(ListMyReservationsQuery.of({ memberId: '1', cursor: 'invalid' })),
    ).rejects.toThrow('INVALID_RESERVATION_CURSOR');
  });
});

function reservationRow(overrides: Partial<Record<string, unknown>> = {}) {
  const seat = {
    id: '1001',
    seatRow: 'A',
    seatCol: 1,
    seatType: 'NORMAL',
  };
  const movie = {
    id: '1',
    title: '파묘',
    rating: '15',
    posterUrl: 'https://images.example.com/fallback-poster.jpg',
    images: collection([
      {
        id: '1',
        imageType: 'POSTER',
        url: 'https://images.example.com/poster.jpg',
        sortOrder: 0,
      },
    ]),
  };

  return {
    id: '5001',
    reservationNumber: 'R00000000000005003',
    status: 'CONFIRMED',
    totalPrice: 15000,
    createdAt: new Date('2026-04-30T10:03:00.000Z'),
    canceledAt: undefined,
    cancelReason: undefined,
    screening: {
      id: '101',
      movie,
      screen: {
        name: '1관',
        theater: {
          id: '1',
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
        },
      },
      startAt: new Date('2026-04-30T11:00:00.000Z'),
      endAt: new Date('2026-04-30T13:00:00.000Z'),
    },
    reservationSeats: collection([
      {
        seat,
      },
    ]),
    ...overrides,
  };
}

function paymentRow(params: { reservation: unknown }) {
  return {
    id: '7001',
    reservation: params.reservation,
    status: 'APPROVED',
    amount: 15000,
    providerPaymentId: 'local-payment-7001',
  };
}

function collection<T>(items: T[]) {
  return {
    getItems: () => items,
  };
}
