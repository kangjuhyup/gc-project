import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMovies } from '@/features/movies/movieApi';
import { apiClient } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  apiClient: vi.fn(),
}));

const mockedApiClient = vi.mocked(apiClient);

describe('movieApi', () => {
  beforeEach(() => {
    mockedApiClient.mockResolvedValue({ items: [], hasNext: false });
  });

  it('영화 목록 조회 시 현재 시각을 time query 로 함께 전달한다', async () => {
    await fetchMovies({
      keyword: '  파묘  ',
      time: '2026-04-28T10:30:00.000Z',
    });

    expect(mockedApiClient).toHaveBeenCalledWith(
      '/movies?limit=20&time=2026-04-28T10%3A30%3A00.000Z&keyword=%ED%8C%8C%EB%AC%98',
    );
  });
});
