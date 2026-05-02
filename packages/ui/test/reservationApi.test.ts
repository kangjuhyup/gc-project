import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cancelReservation,
  fetchReservationDetail,
  fetchReservations,
} from '@/features/reservations/reservationApi';
import { setStoredAccessToken, clearStoredAccessToken } from '@/lib/apiClient';

describe('reservationApi', () => {
  afterEach(() => {
    clearStoredAccessToken();
    vi.unstubAllGlobals();
  });

  it('내 예매 목록을 OpenAPI 커서 페이지네이션 endpoint로 조회하고 UI 모델로 변환한다', async () => {
    setStoredAccessToken('access-token');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: '5001',
              reservationNumber: 'R00000000000005001',
              status: 'CONFIRMED',
              totalPrice: 30000,
              createdAt: '2026-04-30T10:20:00.000Z',
              movie: {
                id: '1',
                title: '파묘',
                rating: '15',
                posterUrl: 'https://images.example.com/poster.jpg',
              },
              screening: {
                id: '101',
                screenName: '1관',
                startAt: '2026-04-30T12:00:00.000Z',
                endAt: '2026-04-30T14:00:00.000Z',
                theater: {
                  id: '1',
                  name: 'GC 시네마 강남',
                  address: '서울특별시 강남구 테헤란로 427',
                },
              },
              seats: [
                { id: '1001', row: 'A', col: 1, type: 'NORMAL' },
                { id: '1002', row: 'A', col: 2, type: 'NORMAL' },
              ],
              payment: {
                id: '7001',
                status: 'APPROVED',
                amount: 30000,
              },
            },
          ],
          hasNext: true,
          nextCursor: 'next-cursor',
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-reservation-list',
    });

    const result = await fetchReservations({ cursor: 'cursor-1', limit: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/reservations?limit=10&cursor=cursor-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer access-token',
          'x-correlation-id': 'correlation-reservation-list',
        }),
      }),
    );
    expect(result).toMatchObject({
      hasNext: true,
      nextCursor: 'next-cursor',
      items: [
        {
          id: '5001',
          movieTitle: '파묘',
          posterUrl: 'https://images.example.com/poster.jpg',
          screeningStartAt: '2026-04-30T12:00:00.000Z',
          screenName: '1관',
          seats: ['A1', 'A2'],
          payment: {
            id: '7001',
            status: 'APPROVED',
            amount: 30000,
          },
        },
      ],
    });
  });

  it('예매 취소 요청을 OpenAPI 스펙의 cancel endpoint로 전송한다', async () => {
    setStoredAccessToken('access-token');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reservationId: '5001',
          paymentId: '7001',
          reservationStatus: 'CANCELED',
          paymentStatus: 'REFUND_REQUIRED',
          reason: '사용자 요청',
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-reservation-cancel',
    });

    const result = await cancelReservation('5001', { reason: '사용자 요청' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/reservations/5001/cancel',
      expect.objectContaining({
        body: JSON.stringify({ reason: '사용자 요청' }),
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer access-token',
          'x-correlation-id': 'correlation-reservation-cancel',
        }),
      }),
    );
    expect(result).toMatchObject({
      reservationId: '5001',
      reservationStatus: 'CANCELED',
      paymentStatus: 'REFUND_REQUIRED',
    });
  });

  it('내 예매 상세을 OpenAPI 상세 endpoint로 조회하고 UI 모델로 변환한다', async () => {
    setStoredAccessToken('access-token');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: '5001',
          reservationNumber: 'R00000000000005001',
          status: 'CONFIRMED',
          totalPrice: 15000,
          paymentAmount: 15000,
          createdAt: '2026-04-30T10:20:00.000Z',
          movie: {
            id: '1',
            title: '파묘',
            rating: '15',
            posterUrl: 'https://images.example.com/poster.jpg',
          },
          screening: {
            id: '101',
            screenName: '1관',
            startAt: '2026-04-30T12:00:00.000Z',
            endAt: '2026-04-30T14:00:00.000Z',
            theater: {
              id: '1',
              name: 'GC 시네마 강남',
              address: '서울특별시 강남구 테헤란로 427',
            },
          },
          seats: [{ id: '1001', row: 'A', col: 1, type: 'NORMAL' }],
          payment: {
            id: '7001',
            status: 'APPROVED',
            amount: 15000,
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-reservation-detail',
    });

    const result = await fetchReservationDetail('5001');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/reservations/5001',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer access-token',
          'x-correlation-id': 'correlation-reservation-detail',
        }),
      }),
    );
    expect(result).toMatchObject({
      id: '5001',
      movieTitle: '파묘',
      paymentAmount: 15000,
      payment: {
        id: '7001',
        status: 'APPROVED',
      },
      reservationNumber: 'R00000000000005001',
      seats: ['A1'],
    });
  });
});
