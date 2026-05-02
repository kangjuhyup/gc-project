import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchTheaterSchedules, fetchTheaters } from '@/features/movies/theaterApi';
import { apiClient } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  apiClient: vi.fn(),
}));

const mockedApiClient = vi.mocked(apiClient);

describe('theaterApi', () => {
  beforeEach(() => {
    mockedApiClient.mockResolvedValue({
      items: [
        {
          id: 1,
          name: 'GC 시네마 강남',
          address: '서울특별시 강남구 테헤란로 427',
        },
      ],
    });
  });

  it('OpenAPI 영화관 목록 endpoint를 호출한다', async () => {
    const result = await fetchTheaters();

    expect(mockedApiClient).toHaveBeenCalledWith('/theaters');
    expect(result.items).toEqual([
      expect.objectContaining({
        id: 1,
        name: 'GC 시네마 강남',
      }),
    ]);
  });

  it('영화관 기준 상영시간표 endpoint를 호출한다', async () => {
    await fetchTheaterSchedules(1, '2026-05-01');

    expect(mockedApiClient).toHaveBeenCalledWith('/theaters/1/schedules?date=2026-05-01');
  });
});
