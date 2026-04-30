import { describe, expect, it, vi } from 'vitest';
import { ListMyReservationsQuery } from '@application';
import { MikroOrmReservationQueryRepository } from '@infrastructure/persistence/repositories';

describe('MikroOrmReservationQueryRepository', () => {
  it('내 예매 목록을 최신순 커서 페이지네이션 응답으로 매핑한다', async () => {
    const rows = [
      reservationRow({ reservationId: '5003', reservationCreatedAt: new Date('2026-04-30T10:03:00.000Z') }),
      reservationRow({ reservationId: '5002', reservationCreatedAt: new Date('2026-04-30T10:02:00.000Z') }),
      reservationRow({ reservationId: '5001', reservationCreatedAt: new Date('2026-04-30T10:01:00.000Z') }),
    ];
    const entityManager = {
      execute: vi.fn().mockResolvedValue(rows),
    };
    const repository = new MikroOrmReservationQueryRepository(entityManager as never);

    const result = await repository.listMyReservations(ListMyReservationsQuery.of({ memberId: '1', limit: 2 }));

    expect(entityManager.execute).toHaveBeenCalledWith(expect.stringContaining('ORDER BY r.created_at DESC, r.id DESC'), ['1', 3]);
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
      execute: vi.fn().mockResolvedValue([]),
    };
    const repository = new MikroOrmReservationQueryRepository(entityManager as never);

    await repository.listMyReservations(ListMyReservationsQuery.of({ memberId: '1', limit: 10, cursor }));

    expect(entityManager.execute).toHaveBeenCalledWith(
      expect.stringContaining('r.created_at < ?::timestamptz'),
      ['1', '2026-04-30T10:02:00.000Z', '2026-04-30T10:02:00.000Z', 5002, 11],
    );
  });

  it('잘못된 커서가 들어오면 예매 커서 오류를 던진다', async () => {
    const repository = new MikroOrmReservationQueryRepository({ execute: vi.fn() } as never);

    await expect(
      repository.listMyReservations(ListMyReservationsQuery.of({ memberId: '1', cursor: 'invalid' })),
    ).rejects.toThrow('INVALID_RESERVATION_CURSOR');
  });
});

function reservationRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    reservationId: '5001',
    reservationNumber: 'R00000000000005003',
    reservationStatus: 'CONFIRMED',
    totalPrice: 15000,
    reservationCreatedAt: new Date('2026-04-30T10:03:00.000Z'),
    canceledAt: undefined,
    cancelReason: undefined,
    movieId: '1',
    movieTitle: '파묘',
    movieRating: '15',
    moviePosterUrl: 'https://images.example.com/poster.jpg',
    screeningId: '101',
    screenName: '1관',
    screeningStartAt: new Date('2026-04-30T11:00:00.000Z'),
    screeningEndAt: new Date('2026-04-30T13:00:00.000Z'),
    theaterId: '1',
    theaterName: 'GC 시네마 강남',
    theaterAddress: '서울특별시 강남구 테헤란로 427',
    paymentId: '7001',
    paymentStatus: 'APPROVED',
    paymentAmount: 15000,
    providerPaymentId: 'local-payment-7001',
    seats: [
      {
        id: '1001',
        row: 'A',
        col: 1,
        type: 'NORMAL',
      },
    ],
    ...overrides,
  };
}
