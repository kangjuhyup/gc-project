import { afterEach, describe, expect, it, vi } from 'vitest';
import { cancelReservation } from '@/features/reservations/reservationApi';
import { setStoredAccessToken, clearStoredAccessToken } from '@/lib/apiClient';

describe('reservationApi', () => {
  afterEach(() => {
    clearStoredAccessToken();
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

    const result = await cancelReservation(5001, { reason: '사용자 요청' });

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
});
